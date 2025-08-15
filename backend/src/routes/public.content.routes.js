import { Router } from "express";
import { listPapers, listTestSeries } from "../controllers/content.controller";


const router = Router();

router.get("/papers", listPapers)
router.get("/test-series", listTestSeries);

export default router;
