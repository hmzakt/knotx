// controllers/payment.controller.js
import crypto from "crypto";
import { razorpay } from "../config/razorpay.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Paper } from "../models/papers.model.js";
import { TestSeries } from "../models/testSeries.model.js";
import { Course } from "../models/courses.model.js";
import { markPromoUsed } from "./promocode.controller.js";

const BROAD_TYPES = ["all-access", "all-courses"];

const DEFAULT_DURATION = {
  "single-paper": 30,
  "test-series": 180,
  "all-access": 365,
  "single-course": 365,
  "all-courses": 365,
};

/**
 * POST /api/v1/payments/orders
 * Auth: required
 *
 * Body:
 *   type: "single-paper" | "test-series" | "all-access" | "single-course" | "all-courses"
 *   itemId?: string           — required for single-paper, test-series, single-course
 *   baseAmount: number        — in paise (e.g. ₹499 → 49900)
 *   currency: "INR"           — default INR
 *   promoCode?: string
 *   durationDays?: number     — ignored; server derives duration from type
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment service is currently unavailable.",
      });
    }

    const user = req.user;
    let {
      type,
      itemId,
      baseAmount,
      currency = "INR",
      promoCode,
    } = req.body;

    if (type === "paper") type = "single-paper";

    // ── Validation ────────────────────────────────────────────────
    if (!type) {
      return res
        .status(400)
        .json({ success: false, message: "type is required" });
    }
    if (!DEFAULT_DURATION[type]) {
      return res
        .status(400)
        .json({ success: false, message: `Unknown subscription type: ${type}` });
    }
    if (!BROAD_TYPES.includes(type) && !itemId) {
      return res
        .status(400)
        .json({ success: false, message: "itemId is required for this type" });
    }
    if (!baseAmount || baseAmount < 100) {
      return res.status(400).json({
        success: false,
        message: "baseAmount (≥100 paise) is required",
      });
    }

    // ── Item existence check ──────────────────────────────────────
    if (type === "single-paper") {
      const exists = await Paper.exists({ _id: itemId });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Paper not found" });
      }
    } else if (type === "test-series") {
      const exists = await TestSeries.exists({ _id: itemId });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Test series not found" });
      }
    } else if (type === "single-course") {
      const exists = await Course.exists({ _id: itemId });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
    }

    // ── Apply promo discount ──────────────────────────────────────
    let finalAmount = baseAmount;
    if (promoCode) {
      const promoResp = await fetch(
        `${req.protocol}://${req.get("host")}/api/v1/promos/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization || "",
          },
          body: JSON.stringify({ code: promoCode }),
        }
      )
        .then((r) => r.json())
        .catch(() => ({ success: false }));

      if (promoResp?.success && promoResp.discountPercent) {
        const discount = Math.floor(
          (finalAmount * promoResp.discountPercent) / 100
        );
        finalAmount = Math.max(finalAmount - discount, 100);
      }
    }

    // Server-side duration (not trusted from client)
    const normalizedDuration = DEFAULT_DURATION[type];

    // ── Create Razorpay order ─────────────────────────────────────
    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: user._id.toString(),
        type,
        itemId: itemId || "",
        promoCode: promoCode || "",
        durationDays: String(normalizedDuration),
      },
    });

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
    });
  } catch (err) {
    console.error("createRazorpayOrder error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message });
  }
};

/**
 * POST /api/v1/payments/verify
 * Verifies Razorpay signature, then creates the Subscription and marks promo used.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    // ── Verify HMAC signature ─────────────────────────────────────
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    // ── Fetch order notes (server-authoritative metadata) ─────────
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order?.notes || {};
    const userId = notes.userId;
    const type = notes.type;
    const itemId = notes.itemId || null;
    const promoCode = notes.promoCode || "";
    const durationDays = Number(notes.durationDays || DEFAULT_DURATION[type] || 30);

    // ── Create subscription ───────────────────────────────────────
    const start = new Date();
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      userId,
      type,
      itemId: BROAD_TYPES.includes(type) ? null : itemId,
      startDate: start,
      endDate: end,
      status: "active",
    });

    // Link to user.subscriptions array (best-effort)
    try {
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { subscriptions: subscription._id } },
        { new: false }
      );
    } catch (linkErr) {
      console.warn("Could not link subscription to user:", linkErr?.message);
    }

    // Mark promo code used (best-effort)
    if (promoCode) {
      await markPromoUsed({
        code: promoCode,
        userId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      }).catch((e) => console.warn("markPromoUsed failed:", e.message));
    }

    return res.json({
      success: true,
      message: "Payment verified, subscription active",
      subscription,
    });
  } catch (err) {
    console.error("verifyRazorpayPayment error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message });
  }
};
