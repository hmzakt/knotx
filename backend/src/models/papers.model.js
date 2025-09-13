import mongoose, { Schema } from "mongoose";

const paperSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    // duration in seconds for attempts on this paper
    durationSec: {
        type: Number,
        default: 0 // 0 means no limit
    },
    questions: [
        {
            type: Schema.Types.ObjectId,
            ref: "Question"
        }
    ]
},
    { timestamps: true }
)

export const Paper = mongoose.model("Paper", paperSchema)