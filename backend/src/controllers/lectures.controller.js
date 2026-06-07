import fs from "fs-extra";
import path from "path";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { Lecture } from "../models/lectures.model.js";
import { Course } from "../models/courses.model.js";
import { Section } from "../models/courseSections.model.js";
import { convertToHLS } from "../services/ffmpeg.service.js";
import { uploadDirectoryToR2, getR2Object, deleteR2Prefix } from "../services/r2.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

/**
 *
 * Body fields:
 *   title       (required)
 *   courseId    (required)
 *   sectionId   optional — omit for flat/unsectioned courses
 *   description optional
 *   order       optional number (default 0)
 *   isPreviewFree optional boolean string "true"/"false" (default false)
 *
 * File: field name "video"
 *
 * Pipeline:
 *   1. Validate inputs + verify course/section exist
 *   2. ffmpeg → HLS (720p + 360p) in a temp dir
 *   3. Upload HLS files to R2 under lectures/{uuid}/
 *   4. Create Lecture document
 *   5. Push lecture._id to Section or Course
 *   6. Increment course totalDuration
 *   7. Cleanup temp files
 */
export const uploadLecture = async (req, res) => {
  const videoFile = req.file;
  let outputDir = null;

  try {
    const { title, courseId, sectionId, description, order, isPreviewFree } =
      req.body;

    // Validation
    if (!videoFile) {
      return res.status(400).json(new ApiError(400, "Video file is required"));
    }
    if (!title?.trim() || !courseId) {
      await fs.remove(videoFile.path).catch(() => { });
      return res
        .status(400)
        .json(new ApiError(400, "title and courseId are required"));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      await fs.remove(videoFile.path).catch(() => { });
      return res.status(404).json(new ApiError(404, "Course not found"));
    }

    // Optional
    if (sectionId) {
      const section = await Section.findOne({
        _id: sectionId,
        course: courseId,
      });
      if (!section) {
        await fs.remove(videoFile.path).catch(() => { });
        return res
          .status(404)
          .json(new ApiError(404, "Section not found in this course"));
      }
    }

    // HLS transcode─
    const lectureId = uuid();
    outputDir = path.join("src", "temp", lectureId);

    console.log(`[uploadLecture] Starting HLS transcode for lecture ${lectureId}`);
    const { duration } = await convertToHLS(videoFile.path, outputDir);
    console.log(`[uploadLecture] Transcode done. Duration: ${duration}s`);
    // Upload to R2
    const keyPrefix = `lectures/${lectureId}`;
    await uploadDirectoryToR2(outputDir, keyPrefix);
    console.log(`[uploadLecture] Uploaded to R2 at ${keyPrefix}`);

    // Persist lecture 
    const lecture = await Lecture.create({
      title: title.trim(),
      description,
      course: courseId,
      section: sectionId || null,
      videoKey: keyPrefix,
      duration,
      order: order != null ? Number(order) : 0,
      isPreviewFree: isPreviewFree === "true" || isPreviewFree === true,
      isPublished: true,
      processingStatus: "ready",
    });

    if (sectionId) {
      await Section.findByIdAndUpdate(sectionId, {
        $push: { lectures: lecture._id },
      });
    } else {
      await Course.findByIdAndUpdate(courseId, {
        $push: { lectures: lecture._id },
      });
    }
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalDuration: duration },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, lecture, "Lecture uploaded and ready"));
  } catch (error) {
    console.error("uploadLecture error:", error);
    return res
      .status(500)
      .json(new ApiError(500, `Upload failed: ${error.message}`));
  } finally {
    // Always clean up temp files
    if (videoFile?.path) await fs.remove(videoFile.path).catch(() => { });
    if (outputDir) await fs.remove(outputDir).catch(() => { });
  }
};

// PLAYBACK — issue stream token

/**
 * GET /api/v1/lectures/:id/play?courseId=<courseId>
 * Auth: verifyJWT + gateCourseLecture (subscription or free preview)
 *
 * Issues a short-lived HLS stream token (1 hour).
 * Client uses the returned hlsUrl to load the master playlist through
 * the proxy endpoint below, which handles all R2 authentication internally.
 *
 * Response:
 * {
 *   streamToken: string,
 *   hlsUrl: string   ← full URL to master.m3u8 via our proxy
 * }
 */
export const getLecturePlayback = async (req, res) => {
  try {
    const { id } = req.params;

    const lecture = await Lecture.findById(id)
      .select("videoKey title isPublished")
      .lean();

    if (!lecture) {
      return res.status(404).json(new ApiError(404, "Lecture not found"));
    }
    if (!lecture.isPublished) {
      return res.status(404).json(new ApiError(404, "Lecture not available"));
    }

    // Mint a stream token valid for 1 hour
    const streamToken = jwt.sign(
      {
        lectureId: lecture._id.toString(),
        videoKey: lecture.videoKey,
        type: "hls-stream",
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Build the master playlist URL pointing to our proxy route
    const baseUrl =
      process.env.API_BASE_URL ||
      `${req.protocol}://${req.get("host")}`;

    const hlsUrl = `${baseUrl}/api/v1/lectures/stream/${streamToken}/master.m3u8`;

    return res.status(200).json(
      new ApiResponse(
        200,
        { streamToken, hlsUrl, title: lecture.title },
        "Stream ready"
      )
    );
  } catch (error) {
    console.error("getLecturePlayback error:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Failed to generate stream token"));
  }
};

// HLS PROXY — stream content from private R2

/**
 * GET /api/v1/lectures/stream/:token/:file
 * No external auth middleware — the token IS the auth.
 * Proxies HLS content from private R2 through the backend.
 * For .m3u8 files: rewrites relative segment/playlist URLs to proxy URLs
 *   so the player always fetches through this endpoint.
 * For .ts files: pipes the R2 body stream directly to the client.
 */
export const streamHLSContent = async (req, res) => {
  try {
    const { token, file } = req.params;

    // Verify stream token
    let payload;
    try {
      payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired stream token" });
    }

    if (payload.type !== "hls-stream" || !payload.videoKey) {
      return res.status(401).json({ message: "Invalid stream token" });
    }

    // Only allow known HLS file extensions
    const allowedExtensions = [".m3u8", ".ts"];
    const ext = path.extname(file).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    const objectKey = `${payload.videoKey}/${file}`;

    //Fetch from R2
    let r2Response;
    try {
      r2Response = await getR2Object(objectKey);
    } catch (err) {
      if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
        return res.status(404).json({ message: "HLS file not found" });
      }
      throw err;
    }

    // Serve .ts segments: pipe stream directly
    if (ext === ".ts") {
      res.setHeader("Content-Type", "video/mp2t");
      res.setHeader("Cache-Control", "private, max-age=300");
      if (r2Response.ContentLength) {
        res.setHeader("Content-Length", r2Response.ContentLength);
      }

      // SDK v3 Body is a web ReadableStream; convert to Node readable
      const nodeStream = r2Response.Body.transformToWebStream
        ? r2Response.Body // already a web stream → use as-is if res supports it
        : r2Response.Body;

      // Use the SDK's transformToByteArray for compatibility, then send
      const bytes = await r2Response.Body.transformToByteArray();
      return res.end(Buffer.from(bytes));
    }

    // Serve .m3u8 playlists: rewrite relative URLs to proxy URLs
    const rawContent = await r2Response.Body.transformToString("utf-8");

    const baseUrl =
      process.env.API_BASE_URL ||
      `${req.protocol}://${req.get("host")}`;
    const proxyBase = `${baseUrl}/api/v1/lectures/stream/${token}`;

    // Rewrite every non-comment, non-empty line that is a relative URL
    const rewritten = rawContent
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        // Leave EXT tags and empty lines untouched
        if (!trimmed || trimmed.startsWith("#")) return line;
        // Rewrite relative filenames to absolute proxy URLs
        if (!trimmed.startsWith("http")) {
          return `${proxyBase}/${trimmed}`;
        }
        return line;
      })
      .join("\n");

    res.setHeader("Content-Type", "application/x-mpegURL");
    res.setHeader("Cache-Control", "private, no-cache");
    return res.send(rewritten);
  } catch (error) {
    console.error("streamHLSContent error:", error);
    return res.status(500).json({ message: "Stream error" });
  }
};

// ADMIN OPERATIONS

/**
 * DELETE /api/v1/lectures/:id
 * Admin only.
 * Deletes R2 HLS objects, unlinks from section/course, decrements totalDuration.
 */
export const deleteLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json(new ApiError(404, "Lecture not found"));
    }

    // Delete all HLS files from R2
    if (lecture.videoKey) {
      await deleteR2Prefix(lecture.videoKey).catch((e) =>
        console.warn(`R2 cleanup failed for ${lecture.videoKey}:`, e.message)
      );
    }

    // Remove from section or course array
    if (lecture.section) {
      await Section.findByIdAndUpdate(lecture.section, {
        $pull: { lectures: lecture._id },
      });
    } else {
      await Course.findByIdAndUpdate(lecture.course, {
        $pull: { lectures: lecture._id },
      });
    }

    // Decrement course total duration
    if (lecture.duration) {
      await Course.findByIdAndUpdate(lecture.course, {
        $inc: { totalDuration: -lecture.duration },
      });
    }

    await lecture.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Lecture deleted successfully"));
  } catch (error) {
    console.error("deleteLecture error:", error);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

/**
 * PATCH /api/v1/lectures/:id
 * Admin only — update lecture metadata (no video replacement).
 */
export const updateLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, isPreviewFree, isPublished } = req.body;

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json(new ApiError(404, "Lecture not found"));
    }

    if (title !== undefined) lecture.title = title.trim();
    if (description !== undefined) lecture.description = description;
    if (order !== undefined) lecture.order = Number(order);
    if (isPreviewFree !== undefined)
      lecture.isPreviewFree = isPreviewFree === true || isPreviewFree === "true";
    if (isPublished !== undefined)
      lecture.isPublished = isPublished === true || isPublished === "true";

    await lecture.save();
    return res
      .status(200)
      .json(new ApiResponse(200, lecture, "Lecture updated"));
  } catch (error) {
    console.error("updateLecture error:", error);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

// PUBLIC

/**
 * GET /api/v1/lectures/course/:courseId
 * Public — returns metadata only, no video keys or signed URLs.
 * Frontend uses this to render course curriculum.
 */
export const getLecturesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const lectures = await Lecture.find({
      course: courseId,
      isPublished: true,
    })
      .select("title description duration order section isPreviewFree")
      .sort({ order: 1 })
      .lean();

    return res
      .status(200)
      .json(new ApiResponse(200, lectures, "Lectures listed"));
  } catch (error) {
    console.error("getLecturesByCourse error:", error);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};