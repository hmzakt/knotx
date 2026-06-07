import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // Use UUID + original extension to prevent filename collisions on concurrent uploads
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

/**
 * Generic upload — no MIME restriction, 16 MB limit.
 * Used for images, documents, etc.
 */
export const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB
});

/**
 * Video-only upload — accepts video/* MIME types, 3 GB limit.
 * Used for lecture video ingestion before HLS transcode.
 */
const videoFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are accepted"), false);
  }
};

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 * 1024 }, // 3 GB
  fileFilter: videoFileFilter,
});