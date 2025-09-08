import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireSubscriptionForPaper, requireSubscriptionForSeries } from "../middlewares/subscription.middleware.js";
import { getPaperWithQuestions, getTestSeriesWithPapers, listQuestions, listTestSeriesWithPapers, listPapersWithQuestions } from "../controllers/content.controller.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.get("/paper/:id", verifyJWT, requireSubscriptionForPaper, getPaperWithQuestions)
router.get("/papers", verifyJWT, isAdmin, listPapersWithQuestions)
router.get("/test-series/:id", verifyJWT, requireSubscriptionForSeries, getTestSeriesWithPapers)
router.get("/test-series", verifyJWT, isAdmin, listTestSeriesWithPapers)
router.get("/questions", verifyJWT,isAdmin,listQuestions)

export default router;