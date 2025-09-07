import mongoose, { Schema } from "mongoose";

const usedBySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    usedAt: { type: Date, default: Date.now },
    orderId: { type: String },    // Razorpay order id
    paymentId: { type: String }   // Razorpay payment id (when known)
  },
  { _id: false }
);

const promoCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    // 0 = unlimited
    maxUses: {
      type: Number,
      default: 0
    },
    usedCount: {
      type: Number,
      default: 0
    },
    // hard expiry
    expiresAt: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    usedBy: [usedBySchema]
  },
  { timestamps: true }
);

promoCodeSchema.virtual("isExpired").get(function () {
  return !!this.expiresAt && new Date() > this.expiresAt;
});

export const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
