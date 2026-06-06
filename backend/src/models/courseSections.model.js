import mongoose from "mongoose";

const sectionSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
      },

      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },

      order: {
        type: Number,
        default: 0,
      },

      lectures: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lecture",
        },
      ],
    },
    {
      timestamps: true,
    }
  );

export const Section =
  mongoose.model(
    "Section",
    sectionSchema
  );