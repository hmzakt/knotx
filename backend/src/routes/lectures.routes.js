import { Router } from "express";
import { uploadVideo } from "../middlewares/multer.middelware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { gateCourseLecture } from "../middlewares/courseAccess.middleware.js";
import {
  uploadLecture,
  getLecturePlayback,
  streamHLSContent,
  deleteLecture,
  updateLecture,
  getLecturesByCourse,
} from "../controllers/lectures.controller.js";

const router = Router();

// Public — no auth needed
// Curriculum metadata for a course (no video keys)
router.get("/course/:courseId", getLecturesByCourse);

// HLS streaming proxy — token IS the auth (no verifyJWT middleware here)
// Must come before /:id routes to avoid param conflicts
router.get("/stream/:token/:file", streamHLSContent);

// Admin — create/update/delete
router.post(
  "/upload",
  verifyJWT,
  isAdmin,
  uploadVideo.single("video"),
  uploadLecture
);
router.patch("/:id", verifyJWT, isAdmin, updateLecture);
router.delete("/:id", verifyJWT, isAdmin, deleteLecture);

// Authenticated + subscription gated — get stream token
// gateCourseLecture: allows free-preview lectures without subscription check,
// otherwise requires all-courses or single-course subscription.
// Frontend must pass ?courseId=<courseId> query param.
router.get("/:id/play", verifyJWT, gateCourseLecture, getLecturePlayback);

export default router;