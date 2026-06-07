import { Subscription } from "../models/subscription.model.js";
import { Lecture } from "../models/lectures.model.js";

/**
 * Require an active subscription that grants access to a specific COURSE.
 *
 * The frontend must pass `courseId` as a query param:
 *   GET /api/v1/lectures/:id/play?courseId=<courseId>
 *
 * Grants access if:
 *   - user has an active "all-courses" subscription, OR
 *   - user has an active "single-course" subscription for this specific course
 *
 * NOTE: "all-access" covers ONLY papers/test-series and does NOT grant course access.
 */

export const requireSubscriptionForCourse = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.query;
    const now = new Date();

    if (!courseId) {
      return res
        .status(400)
        .json({ message: "courseId query param is required for course playback" });
    }

    // Check all-courses subscription
    const hasAllCourses = await Subscription.findOne({
      userId,
      type: "all-courses",
      status: "active",
      endDate: { $gte: now },
    }).lean();
    if (hasAllCourses) return next();

    // Check single-course subscription for this specific course
    const hasSingleCourse = await Subscription.findOne({
      userId,
      type: "single-course",
      itemId: courseId,
      status: "active",
      endDate: { $gte: now },
    }).lean();
    if (hasSingleCourse) return next();

    return res
      .status(403)
      .json({ message: "No active subscription for this course" });
  } catch (err) {
    console.error("requireSubscriptionForCourse error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Smart gate for lecture playback:
 *   - If the lecture is marked isPreviewFree → allow without subscription
 *   - Otherwise → run requireSubscriptionForCourse
 *
 * Uses req.params.id (lecture id) to check isPreviewFree.
 * Must be used AFTER verifyJWT (needs req.user).
 */
export const gateCourseLecture = async (req, res, next) => {
  try {
    const lectureId = req.params.id;

    const lecture = await Lecture.findById(lectureId)
      .select("isPreviewFree isPublished")
      .lean();

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    if (!lecture.isPublished) {
      return res.status(404).json({ message: "Lecture not available" });
    }

    // Free preview — bypass subscription check
    if (lecture.isPreviewFree) return next();

    return requireSubscriptionForCourse(req, res, next);
  } catch (err) {
    console.error("gateCourseLecture error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
