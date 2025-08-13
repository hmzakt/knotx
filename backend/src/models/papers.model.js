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