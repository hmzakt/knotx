import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /**
     * Subscription types:
     *
     * ── Papers / Test-series ──────────────────────────────────────
     * "single-paper"  → itemId = Paper._id
     * "test-series"   → itemId = TestSeries._id
     * "all-access"    → grants access to ALL papers + ALL test-series
     *                   (does NOT include video courses)
     *
     * ── Video Courses ─────────────────────────────────────────────
     * "single-course" → itemId = Course._id
     * "all-courses"   → grants access to ALL video courses
     *                   (does NOT include papers/test-series)
     */
    type: {
      type: String,
      enum: [
        "single-paper",
        "test-series",
        "all-access",
        "single-course",
        "all-courses",
      ],
      required: true,
    },

    itemId: {
      type: Schema.Types.ObjectId,
      // Required for item-level subscriptions; not for all-* types
      required: function () {
        return (
          this.type === "single-paper" ||
          this.type === "test-series" ||
          this.type === "single-course"
        );
      },
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

/**
 * Compound unique index:
 * Prevents multiple active subscriptions of the same type/item for the same user.
 * For all-* types, itemId is null — still prevents duplicate all-access/all-courses subs.
 */
subscriptionSchema.index(
  { userId: 1, type: 1, itemId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
