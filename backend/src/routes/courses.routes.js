import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import {
  listCourses,
  getCourseDetails,
  listCoursesAdmin,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
} from "../controllers/courses.controller.js";
import {
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from "../controllers/sections.controller.js";

const router = Router();

// Public
router.get("/", listCourses);

// Admin-only list must come before /:id to avoid param match
router.get("/admin/all", verifyJWT, isAdmin, listCoursesAdmin);

router.get("/:id", getCourseDetails);

// Admin — course CRUD
router.post("/", verifyJWT, isAdmin, createCourse);
router.put("/:id", verifyJWT, isAdmin, updateCourse);
router.delete("/:id", verifyJWT, isAdmin, deleteCourse);
router.patch("/:id/publish", verifyJWT, isAdmin, publishCourse);
router.patch("/:id/unpublish", verifyJWT, isAdmin, unpublishCourse);

// Admin — section management (nested under course)
// Reorder must come before /:id (section) to avoid param conflicts
router.patch(
  "/:courseId/sections/reorder",
  verifyJWT,
  isAdmin,
  reorderSections
);
router.post("/:courseId/sections", verifyJWT, isAdmin, createSection);
router.put("/:courseId/sections/:id", verifyJWT, isAdmin, updateSection);
router.delete("/:courseId/sections/:id", verifyJWT, isAdmin, deleteSection);

export default router;
