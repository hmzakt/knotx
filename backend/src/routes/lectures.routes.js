import { Router } from "express";
import { upload } from "../middlewares/multer.middelware.js";
import { uploadLecture } from "../controllers/lectures.controller.js";
import { getLecturePlayback } from "../controllers/lectures.controller.js";

const router = Router();

router.post(
  "/upload",
  upload.single("video"),
  uploadLecture
);

router.get(
  "/:id/play",
  verifyJWT,
  getLecturePlayback
);

export default router;