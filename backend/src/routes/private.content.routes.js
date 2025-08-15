import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { requireSubscriptionForPaper, requireSubscriptionForSeries } from "../middlewares/subscription.middleware.js";
import { getPaperWithQuestions, getTestSeriesWithPapers } from "../controllers/content.controller.js";

const router = Router();

router.get("/paper/:id", verifyJWT, requireSubscriptionForPaper, getPaperWithQuestions)
router.get("/test-series/:id", verifyJWT, requireSubscriptionForSeries, getTestSeriesWithPapers)

export default router;