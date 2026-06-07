import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    // Parent course (always required)
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Optional parent section — null for flat/unsectioned courses
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },

    thumbnail: {
      url: String,
      public_id: String, // Cloudinary public_id
    },

    // Duration in seconds (populated post-transcode)
    duration: {
      type: Number,
      default: 0,
    },

    // Display order within its section (or course if no section)
    order: {
      type: Number,
      default: 0,
    },

    // Whether non-subscribers can preview this lecture
    isPreviewFree: {
      type: Boolean,
      default: false,
    },

    // Admin can unpublish individual lectures
    isPublished: {
      type: Boolean,
      default: false,
    },

    // R2 key prefix: "lectures/{uuid}" — all HLS files live under this prefix
    // e.g. lectures/{uuid}/master.m3u8, lectures/{uuid}/720p.m3u8, etc.
    videoKey: {
      type: String,
    },

    // Lifecycle of the transcode + upload pipeline
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "ready", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookup for all published lectures belonging to a course/section
lectureSchema.index({ course: 1, isPublished: 1, order: 1 });

export const Lecture = mongoose.model("Lecture", lectureSchema);