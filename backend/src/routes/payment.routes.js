// routes/payment.routes.js
import express from "express";
import { Router } from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/payment.controller.js";
import { handleRazorpayWebhook } from "../controllers/webhook.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Create order (user must be logged in)
router.post("/orders", verifyJWT, createRazorpayOrder);

// Frontend client-side verification fallback (optional but useful)
router.post("/verify", verifyJWT, verifyRazorpayPayment);

// Razorpay webhook -> must use RAW body; no auth
router.post(
  "/webhook",
  // IMPORTANT: raw body for signature validation
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    // Save raw buffer for HMAC verification in controller
    req.rawBody = req.body; // raw buffer
    try {
      req.body = JSON.parse(req.rawBody.toString("utf-8")); // parse JSON for convenience
    } catch {
      req.body = {};
    }
    next();
  },
  handleRazorpayWebhook
);

export default router;
