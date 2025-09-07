// routes/promocode.routes.js
import { Router } from "express";
import {
  createPromoCode,
  listPromoCodes,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
  exportPromoUsageCsv
} from "../controllers/promocode.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

// Admin CRUD
router.post("/", verifyJWT, isAdmin, createPromoCode);
router.get("/", verifyJWT, isAdmin, listPromoCodes);
router.put("/:id", verifyJWT, isAdmin, updatePromoCode);
router.delete("/:id", verifyJWT, isAdmin, deletePromoCode);
router.get("/usage/export", verifyJWT, isAdmin, exportPromoUsageCsv);

// User validation (auth required)
router.post("/validate", verifyJWT, validatePromoCode);

export default router;
