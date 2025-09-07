// controllers/webhook.controller.js
import crypto from "crypto";
import { Subscription } from "../models/subscription.model.js";
import { markPromoUsed } from "./promocode.controller.js";

/**
 * POST /api/v1/payments/webhook
 * Must use raw body. Verify via RAZORPAY_WEBHOOK_SECRET.
 * Handles "order.paid" or "payment.captured" events.
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // compute expected signature over raw body
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody) // IMPORTANT: use raw body buffer
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = req.body; // parsed JSON of raw body
    // We care about "order.paid" (contains order + payments) or "payment.captured"
    if (event?.event === "order.paid") {
      const order = event?.payload?.order?.entity;
      const payment = event?.payload?.payment?.entity;
      const notes = order?.notes || {};
      const userId = notes.userId;
      const type = notes.type;
      const itemId = notes.itemId || null;
      const promoCode = notes.promoCode || "";
      const durationDays = Number(notes.durationDays || 30);

      if (userId && type) {
        const start = new Date();
        const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

        // Defensive check: prevent duplicate active subs for same item/type window
        const dup = await Subscription.findOne({
          userId,
          type,
          ...(type !== "all-access" ? { itemId } : {}),
          status: "active",
          endDate: { $gte: start }
        });
        if (!dup) {
          await Subscription.create({
            userId,
            type,
            itemId: type === "all-access" ? null : itemId,
            startDate: start,
            endDate: end,
            status: "active"
          });
        }

        if (promoCode) {
          await markPromoUsed({
            code: promoCode,
            userId,
            orderId: order?.id,
            paymentId: payment?.id
          });
        }
      }
    }

    return res.json({ success: true, received: true });
  } catch (err) {
    console.error("handleRazorpayWebhook error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
