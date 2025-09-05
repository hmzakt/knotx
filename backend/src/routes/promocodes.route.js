// // routes/promocode.routes.js
// import { Router } from "express";
// import {
//   createPromoCode,
//   listPromoCodes,
//   updatePromoCode,
//   deletePromoCode,
//   validatePromoCode,
//   exportPromoUsageCsv
// } from "../controllers/promocode.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { requireRole } from "../middlewares/role.middleware.js"; // assumes you added a role guard

// const router = Router();

// // Admin CRUD
// router.post("/", verifyJWT, requireRole("admin"), createPromoCode);
// router.get("/", verifyJWT, requireRole("admin"), listPromoCodes);
// router.put("/:id", verifyJWT, requireRole("admin"), updatePromoCode);
// router.delete("/:id", verifyJWT, requireRole("admin"), deletePromoCode);
// router.get("/usage/export", verifyJWT, requireRole("admin"), exportPromoUsageCsv);

// // User validation (auth required)
// router.post("/validate", verifyJWT, validatePromoCode);

// export default router;
