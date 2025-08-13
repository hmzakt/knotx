import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { createPaper, createQuestion, createTestSeries, promoteToAdmin } from "../controllers/admin.controller.js";


const router = Router();

router.use(verifyJWT, isAdmin);

// post - api/admin/test-series
//create new test series

router.post("/test-series", createTestSeries);

//post - api/admin/paper
// create a new paper

router.post("/paper", createPaper);

// post -> api/admin/question
// create a new question

router.post("/question", createQuestion)

router.post("/promote/:userId", promoteToAdmin);

export default router;