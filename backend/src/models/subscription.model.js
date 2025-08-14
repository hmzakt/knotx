import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: ["single-paper", "test-series", "all-access"],
            required: true
        },
        itemId: {
            type: Schema.Types.ObjectId,
            required: function () {
                return this.type !== "all-access";
            }
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["active", "expired"],
            default: "active"
        }
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
