import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireSubscriptionForPaper, requireSubscriptionForSeries } from "../middlewares/subscription.middleware";
import { getPaperWithQuestions, getTestSeriesWithPapers } from "../controllers/content.controller";

const router = Router();

router.get("/paper/:id", verifyJWT, requireSubscriptionForPaper, getPaperWithQuestions)
router.get("/test-series/:id", verifyJWT, requireSubscriptionForSeries, getTestSeriesWithPapers)

export default router;