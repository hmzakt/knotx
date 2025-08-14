import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { createPaper, createQuestion, createTestSeries, promoteToAdmin } from "../controllers/admin.controller.js";
import { deleteQuestion, updateQuestion } from "../controllers/question.controller.js";
import { addPaperToTestSeries } from "../controllers/testSeries.controller.js";


const router = Router();

router.use(verifyJWT, isAdmin);

// post - api/admin/test-series
//create new test series

router.post("/test-series",verifyJWT, isAdmin, createTestSeries);
router.post("/test-series/:id/add-paper",verifyJWT, isAdmin, addPaperToTestSeries);

//post - api/admin/paper
// create a new paper

router.post("/paper",verifyJWT, isAdmin, createPaper);

// post -> api/admin/question
// create a new question
// All the apis for questions updated
router.post("/question", verifyJWT, isAdmin,createQuestion);
router.put("/question/:id", verifyJWT, isAdmin, updateQuestion);
router.delete("/question/:id", verifyJWT, isAdmin, deleteQuestion);

router.post("/promote/:userId", verifyJWT, isAdmin, promoteToAdmin);

export default router;