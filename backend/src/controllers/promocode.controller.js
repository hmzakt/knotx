// controllers/promocode.controller.js
import { PromoCode } from "../models/promocode.model.js";
import { Parser as Json2CsvParser } from "json2csv";

/**
 * Admin: Create a promo code
 * Body: { code, discountPercent, maxUses (0=unlimited), expiresAt (ISO), isActive? }
 */
export const createPromoCode = async (req, res) => {
  try {
    const { code, discountPercent, maxUses = 0, expiresAt, isActive = true } = req.body;
    if (!code || !discountPercent || !expiresAt) {
      return res.status(400).json({ success: false, message: "code, discountPercent, expiresAt are required" });
    }

    const promo = await PromoCode.create({
      code,
      discountPercent,
      maxUses,
      expiresAt,
      isActive
    });

    return res.status(201).json({ success: true, data: promo });
  } catch (err) {
    console.error("createPromoCode error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** Admin: List all promo codes */
export const listPromoCodes = async (_req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: promos });
  } catch (err) {
    console.error("listPromoCodes error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** Admin: Toggle active or update fields */
export const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body; // allow partial updates
    const updated = await PromoCode.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Promo code not found" });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updatePromoCode error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** Admin: Delete promo code */
export const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const out = await PromoCode.findByIdAndDelete(id);
    if (!out) return res.status(404).json({ success: false, message: "Promo code not found" });
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deletePromoCode error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * User: Validate a promo code before creating order
 * Body: { code }
 * Auth: required
 */
export const validatePromoCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "code is required" });

    const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });
    if (!promo) return res.status(404).json({ success: false, message: "Promo code not found" });
    if (promo.isExpired) return res.status(400).json({ success: false, message: "Promo code expired" });
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ success: false, message: "Promo code usage limit reached" });
    }

    return res.json({
      success: true,
      discountPercent: promo.discountPercent
    });
  } catch (err) {
    console.error("validatePromoCode error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** Internal: mark promo used (called after successful payment) */
export const markPromoUsed = async ({ code, userId, orderId, paymentId }) => {
  if (!code) return;
  const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });
  if (!promo) return;
  promo.usedCount += 1;
  promo.usedBy.push({ userId, orderId, paymentId });
  await promo.save();
};

/** Admin: Export usage CSV */
export const exportPromoUsageCsv = async (_req, res) => {
  try {
    const promos = await PromoCode.find().lean();

    // flatten usedBy entries
    const rows = [];
    promos.forEach(p => {
      if (!p.usedBy || p.usedBy.length === 0) {
        rows.push({
          code: p.code,
          discountPercent: p.discountPercent,
          usedCount: p.usedCount,
          userId: "",
          orderId: "",
          paymentId: "",
          usedAt: ""
        });
      } else {
        p.usedBy.forEach(u => {
          rows.push({
            code: p.code,
            discountPercent: p.discountPercent,
            usedCount: p.usedCount,
            userId: u.userId?.toString() || "",
            orderId: u.orderId || "",
            paymentId: u.paymentId || "",
            usedAt: u.usedAt ? new Date(u.usedAt).toISOString() : ""
          });
        });
      }
    });

    const parser = new Json2CsvParser({
      fields: ["code", "discountPercent", "usedCount", "userId", "orderId", "paymentId", "usedAt"]
    });
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment("promo-usage.csv");
    return res.send(csv);
  } catch (err) {
    console.error("exportPromoUsageCsv error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
