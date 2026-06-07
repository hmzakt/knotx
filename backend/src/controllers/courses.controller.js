import { Course } from "../models/courses.model.js";
import { Section } from "../models/courseSections.model.js";
import { Lecture } from "../models/lectures.model.js";
import { deleteR2Prefix } from "../services/r2.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

export const listCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select(
        "title slug shortDescription thumbnail price isFree category level language " +
        "totalDuration totalEnrollments ratingsAverage ratingsQuantity tags instructor createdAt"
      )
      .populate("instructor", "fullname avatar")
      .sort({ createdAt: -1 })
      .lean();

    return res
      .status(200)
      .json(new ApiResponse(200, courses, "Courses listed"));
  } catch (err) {
    console.error("listCourses error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};


export const getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOne({ _id: id, isPublished: true })
      .populate("instructor", "fullname avatar")
      .populate({
        path: "sections",
        options: { sort: { order: 1 } },
        populate: {
          path: "lectures",
          select: "title description duration order isPreviewFree",
          options: { sort: { order: 1 } },
        },
      })
      .populate({
        path: "lectures", // flat lectures (unsectioned)
        select: "title description duration order isPreviewFree",
        options: { sort: { order: 1 } },
      })
      .lean();

    if (!course) {
      return res.status(404).json(new ApiError(404, "Course not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, course, "Course fetched"));
  } catch (err) {
    console.error("getCourseDetails error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

// ADMIN ENDPOINTS

/**
 * GET /api/v1/courses/admin/all
 * Admin — list all courses (published + unpublished) with summary stats.
 */
export const listCoursesAdmin = async (req, res) => {
  try {
    const courses = await Course.find({})
      .select(
        "title slug isPublished price isFree totalDuration totalEnrollments createdAt"
      )
      .populate("instructor", "fullname")
      .sort({ createdAt: -1 })
      .lean();

    return res
      .status(200)
      .json(new ApiResponse(200, courses, "All courses listed"));
  } catch (err) {
    console.error("listCoursesAdmin error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

/**
 * POST /api/v1/courses
 * Admin — create a new course (no lectures yet).
 *
 * Body:
 *   title (required), description (required), shortDescription,
 *   price, isFree, category, tags (array or comma string),
 *   level (beginner|intermediate|advanced), language,
 *   requirements (array), learningOutcomes (array)
 */
export const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      price,
      isFree,
      category,
      tags,
      level,
      language,
      requirements,
      learningOutcomes,
    } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res
        .status(400)
        .json(new ApiError(400, "title and description are required"));
    }

    // Auto-generate URL-safe slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    const parsedTags = tags
      ? Array.isArray(tags)
        ? tags
        : String(tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const course = await Course.create({
      title: title.trim(),
      slug,
      description: description.trim(),
      shortDescription,
      instructor: req.user._id,
      price: price ?? 0,
      isFree: isFree === true || isFree === "true" || price === 0,
      category,
      tags: parsedTags,
      level: level ?? "beginner",
      language: language ?? "English",
      requirements: requirements ?? [],
      learningOutcomes: learningOutcomes ?? [],
    });

    return res
      .status(201)
      .json(new ApiResponse(201, course, "Course created"));
  } catch (err) {
    console.error("createCourse error:", err);
    if (err.code === 11000) {
      return res
        .status(409)
        .json(new ApiError(409, "A course with this title slug already exists"));
    }
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

/**
 * PUT /api/v1/courses/:id
 * Admin — update course metadata.
 */
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json(new ApiError(404, "Course not found"));
    }

    const updatableFields = [
      "title",
      "description",
      "shortDescription",
      "price",
      "isFree",
      "category",
      "tags",
      "level",
      "language",
      "requirements",
      "learningOutcomes",
      "thumbnail",
    ];

    for (const field of updatableFields) {
      if (req.body[field] !== undefined) course[field] = req.body[field];
    }

    // Re-generate slug if title changed
    if (req.body.title) {
      course.slug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }

    await course.save();
    return res
      .status(200)
      .json(new ApiResponse(200, course, "Course updated"));
  } catch (err) {
    console.error("updateCourse error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

/**
 * PATCH /api/v1/courses/:id/publish
 * Admin — make course visible to students.
 */
export const publishCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isPublished: true },
      { new: true }
    ).select("title isPublished");

    if (!course) {
      return res.status(404).json(new ApiError(404, "Course not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, course, "Course published"));
  } catch (err) {
    console.error("publishCourse error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

/**
 * PATCH /api/v1/courses/:id/unpublish
 * Admin — hide course from students.
 */
export const unpublishCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isPublished: false },
      { new: true }
    ).select("title isPublished");

    if (!course) {
      return res.status(404).json(new ApiError(404, "Course not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, course, "Course unpublished"));
  } catch (err) {
    console.error("unpublishCourse error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

/**
 * DELETE /api/v1/courses/:id
 * Admin — cascade delete: course → sections → lectures → R2 objects.
 */
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json(new ApiError(404, "Course not found"));
    }

    // Collect all lecture IDs from the course's flat array
    // and from every section in the course
    const sections = await Section.find({ course: id }).lean();
    const sectionLectureIds = sections.flatMap((s) => s.lectures);
    const allLectureIds = [
      ...course.lectures,
      ...sectionLectureIds,
    ];

    // Delete R2 HLS files for every lecture
    const lectures = await Lecture.find({
      _id: { $in: allLectureIds },
    }).select("videoKey");

    for (const lecture of lectures) {
      if (lecture.videoKey) {
        await deleteR2Prefix(lecture.videoKey).catch((e) =>
          console.warn(`R2 cleanup failed ${lecture.videoKey}:`, e.message)
        );
      }
    }

    // Delete DB records
    await Lecture.deleteMany({ course: id });
    await Section.deleteMany({ course: id });
    await course.deleteOne();

    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Course and all its content deleted")
      );
  } catch (err) {
    console.error("deleteCourse error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};
