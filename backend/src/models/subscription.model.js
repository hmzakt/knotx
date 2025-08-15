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

/**
 * INDEXES
 * 1. Prevents multiple active subs of the same type for the same user/item.
 * 2. For all-access, itemId is null — still prevents multiple active all-access subs.
 */
subscriptionSchema.index(
    { userId: 1, type: 1, itemId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "active" }
    }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
