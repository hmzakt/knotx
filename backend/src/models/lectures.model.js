import mongoose from "mongoose"

const lectureSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        },
        thumbnail: {
            url: String,
            required: true
        },
        duration: Number,
        order: Number,

        isPreviewFree: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true
    }
);

export const Lecture = mongoose.model("Lecture", lectureSchema)