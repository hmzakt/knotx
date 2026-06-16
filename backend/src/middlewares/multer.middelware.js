import multer from "multer";
import path from "path";
import crypto from "node:crypto";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // Use UUID + original extension to prevent filename collisions on concurrent uploads
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
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

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are accepted"), false);
  }
};

/** Image-only upload — course/lecture thumbnails */
export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFileFilter,
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