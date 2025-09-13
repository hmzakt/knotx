// controllers/payment.controller.js
import crypto from "crypto";
import { razorpay } from "../config/razorpay.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Paper } from "../models/papers.model.js";
import { TestSeries } from "../models/testSeries.model.js";
import { markPromoUsed } from "./promocode.controller.js";

/**
 * POST /api/v1/payments/orders
 * Auth: required
 * Body: {
 *   type: "single-paper" | "test-series" | "all-access",
 *   itemId?: string,               // required for single-paper/test-series
 *   baseAmount: number,            // in paise (INR) (e.g., ₹499 => 49900)
 *   currency: "INR",
 *   promoCode?: string,
 *   durationDays?: number          // default fallback for endDate calc
 * }
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    // Check if Razorpay is available
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment service is currently unavailable. Please try again later."
      });
    }

    const user = req.user;
    let { type, itemId, baseAmount, currency = "INR", promoCode, durationDays = 30 } = req.body;

    // Normalize type to expected enum
    if (type === 'paper') type = 'single-paper';

    // basic validation
    if (!type) return res.status(400).json({ success: false, message: "type is required" });
    if (type !== "all-access" && !itemId)
      return res.status(400).json({ success: false, message: "itemId is required for this type" });
    if (!baseAmount || baseAmount < 100)
      return res.status(400).json({ success: false, message: "baseAmount (>=100) is required (in paise)" });

    // ensure referenced item exists when needed
    if (type === "single-paper") {
      const exists = await Paper.exists({ _id: itemId });
      if (!exists) return res.status(404).json({ success: false, message: "Paper not found" });
    } else if (type === "test-series") {
      const exists = await TestSeries.exists({ _id: itemId });
      if (!exists) return res.status(404).json({ success: false, message: "Test series not found" });
    }

    // apply discount if promo valid
    let finalAmount = baseAmount;
    if (promoCode) {
      // we could call the validatePromoCode controller, but simpler to re-check here:
      const promoResp = await fetch(`${req.protocol}://${req.get("host")}/api/v1/promos/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: req.headers.authorization || "" },
        body: JSON.stringify({ code: promoCode })
      }).then(r => r.json()).catch(() => ({ success: false }));

      if (promoResp?.success && promoResp.discountPercent) {
        const discount = Math.floor((finalAmount * promoResp.discountPercent) / 100);
        finalAmount = Math.max(finalAmount - discount, 100); // minimum ₹1 (100 paise)
      }
    }

    // create Razorpay order
    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: user._id.toString(),
        type,
        itemId: itemId || "",
        promoCode: promoCode || "",
        durationDays: String(durationDays)
      }
    });

    // send order + publishable key to frontend (so they can open Razorpay Checkout)
    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      order
    });
  } catch (err) {
    console.error("createRazorpayOrder error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/payments/verify
 * Auth: required (if you want; optional because verification uses signature)
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Verifies signature, then creates Subscription and marks promo used.
 * This is a fallback to webhooks or can be your primary completion path.
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    // verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // fetch order to read notes metadata (userId, type, itemId, promoCode, durationDays)
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order?.notes || {};
    const userId = notes.userId;
    const type = notes.type;
    const itemId = notes.itemId || null;
    const promoCode = notes.promoCode || "";
    const durationDays = Number(notes.durationDays || 30);

    // create subscription
    const start = new Date();
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      userId,
      type,
      itemId: type === "all-access" ? null : itemId,
      startDate: start,
      endDate: end,
      status: "active"
    });

    // Best-effort linking to user's subscriptions array if such linkage is used elsewhere
    try {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { subscriptions: subscription._id }
      }, { new: false });
    } catch (linkErr) {
      console.warn("Could not link subscription to user.subscriptions array:", linkErr?.message);
    }

    // mark promo usage
    if (promoCode) {
      await markPromoUsed({
        code: promoCode,
        userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
    }

    return res.json({ success: true, message: "Payment verified, subscription active", subscription });
  } catch (err) {
    console.error("verifyRazorpayPayment error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
