import { Section } from "../models/courseSections.model.js";
import { Course } from "../models/courses.model.js";
import { Lecture } from "../models/lectures.model.js";
import { deleteR2Prefix } from "../services/r2.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

/**
 * POST /api/v1/courses/:courseId/sections
 * Admin — create a new section inside a course.
 *
 * Body: { title (required), order (optional) }
 */
export const createSection = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, order } = req.body;

    if (!title?.trim()) {
      return res
        .status(400)
        .json(new ApiError(400, "Section title is required"));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json(new ApiError(404, "Course not found"));
    }

    const section = await Section.create({
      title: title.trim(),
      course: courseId,
      // Default order = current number of sections (append at end)
      order: order != null ? Number(order) : course.sections.length,
    });

    // Link section to course
    await Course.findByIdAndUpdate(courseId, {
      $push: { sections: section._id },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, section, "Section created"));
  } catch (err) {
    console.error("createSection error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

/**
 * PUT /api/v1/courses/:courseId/sections/:id
 * Admin — update a section's title or order.
 */
export const updateSection = async (req, res) => {
  try {
    const { courseId, id } = req.params;
    const { title, order } = req.body;

    const section = await Section.findOne({ _id: id, course: courseId });
    if (!section) {
      return res.status(404).json(new ApiError(404, "Section not found"));
    }

    if (title !== undefined) section.title = title.trim();
    if (order !== undefined) section.order = Number(order);

    await section.save();
    return res
      .status(200)
      .json(new ApiResponse(200, section, "Section updated"));
  } catch (err) {
    console.error("updateSection error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

/**
 * DELETE /api/v1/courses/:courseId/sections/:id
 * Admin — delete a section and all its lectures (including R2 cleanup).
 */
export const deleteSection = async (req, res) => {
  try {
    const { courseId, id } = req.params;

    const section = await Section.findOne({ _id: id, course: courseId });
    if (!section) {
      return res.status(404).json(new ApiError(404, "Section not found"));
    }

    // Delete all lectures in this section
    const lectures = await Lecture.find({ section: id });
    let removedDuration = 0;

    for (const lecture of lectures) {
      if (lecture.videoKey) {
        await deleteR2Prefix(lecture.videoKey).catch((e) =>
          console.warn(`R2 cleanup failed ${lecture.videoKey}:`, e.message)
        );
      }
      removedDuration += lecture.duration || 0;
    }

    await Lecture.deleteMany({ section: id });

    // Update course: remove section ref and decrement totalDuration
    await Course.findByIdAndUpdate(courseId, {
      $pull: { sections: section._id },
      $inc: { totalDuration: -removedDuration },
    });

    await section.deleteOne();

    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Section and its lectures deleted")
      );
  } catch (err) {
    console.error("deleteSection error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

/**
 * PATCH /api/v1/courses/:courseId/sections/reorder
 * Admin — reorder sections by submitting their IDs in desired order.
 *
 * Body: { orderedIds: ["id1", "id2", "id3", ...] }
 */
export const reorderSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res
        .status(400)
        .json(new ApiError(400, "orderedIds must be a non-empty array"));
    }

    // Batch update all section orders in parallel
    await Promise.all(
      orderedIds.map((sectionId, index) =>
        Section.findOneAndUpdate(
          { _id: sectionId, course: courseId },
          { order: index }
        )
      )
    );

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Sections reordered successfully"));
  } catch (err) {
    console.error("reorderSections error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};
