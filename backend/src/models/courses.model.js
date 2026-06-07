import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: true,
    },

    shortDescription: {
      type: String,
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    thumbnail: {
      url: String,
      public_id: String,
    },

    price: {
      type: Number,
      default: 0,
    },

    isFree: {
      type: Boolean,
      default: false,
    },

    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ],

    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],

    category: {
      type: String,
    },

    tags: [String],

    level: {
      type: String,
      enum: [
        "beginner",
        "intermediate",
        "advanced",
      ],
      default: "beginner",
    },

    language: {
      type: String,
      default: "English",
    },

    duration: {
      type: Number,
      default: 0,
    },

    totalDuration: {
      type: Number,
      default: 0,
    },

    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    totalEnrollments: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    ratingsAverage: {
      type: Number,
      default: 0,
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    requirements: [String],

    learningOutcomes: [String],
  },
  {
    timestamps: true,
  }
);

export const Course =
  mongoose.model("Course", courseSchema);