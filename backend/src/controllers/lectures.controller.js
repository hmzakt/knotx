import crypto from "crypto";
global.crypto = crypto;

import fs from "fs-extra";
import path from "path";
import { v4 as uuid } from "uuid";
import { Lecture } from "../models/lectures.model.js";
import { convertToHLS } from "../services/ffmpeg.service.js";

import { uploadDirectoryToR2 } from "../services/r2.service.js";

export const uploadLecture = async (req, res) => {
    try {
      const {
        title,
        description,
        course,
      } = req.body;

      const videoFile = req.file;

      if (!videoFile) {
        return res.status(400).json({
          message: "Video required",
        });
      }

      const lectureId = uuid();

      const outputDir = path.join(
        "src/temp",
        lectureId
      );

      await convertToHLS(
        videoFile.path,
        outputDir
      );

      const videoKey = `lectures/${lectureId}/master.m3u8`;

      const lecture =
        await Lecture.create({
          title,
          description,
          course,
          playbackUrl,
        });

      await fs.remove(videoFile.path);

      await fs.remove(outputDir);

      return res.status(201).json({
        success: true,
        lecture,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        message: "Upload failed",
      });
    }
  };

  export const getLecturePlayback = async (req, res) => {
    try {
      const { id } = req.params;

      const lecture =
        await Lecture.findById(id);

      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found",
        });
      }
      /**
       * TODO:
       * Verify:
       * - user purchased course
       * - subscription active
       */

      const signedUrl =
        await generateSignedPlaybackUrl(
          lecture.videoKey
        );

      return res.status(200).json({
        success: true,
        playbackUrl: signedUrl,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        message:
          "Failed to generate playback",
      });
    }
  };