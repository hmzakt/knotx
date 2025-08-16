import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { requireSubscriptionForPaper } from "../middlewares/subscription.middleware";
import { answerQuestion, getAttempt, listMyAttempts, startAttempt, submitAttempt } from "../controllers/attempts.controller";
import { requireAttemptOwner } from "../middlewares/attempts.middleware";


const router = Router();

//Start attempt : protected to check subscription before beginning the paper
router.post("/start/:paperId", verifyJWT, requireSubscriptionForPaper, startAttempt);

// Record an answer ( owner + in-progress ensured in controller)
router.post("/:attemptId/answer", verifyJWT, requireAttemptOwner, answerQuestion);

// Submit attempt
router.post("/:attemptId/submit", verifyJWT, requireAttemptOwner, submitAttempt);

// Get Attempt
router.get(":/attemptId", verifyJWT, requireAttemptOwner, getAttempt);

//List user's attempts
router.get("/", verifyJWT, listMyAttempts);


export default router;
