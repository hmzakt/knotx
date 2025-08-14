import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createSubscription, deleteSubscription, getMySubscription } from "../controllers/subscription.controller";
import { checkAccess } from "../middlewares/checkAccess.middleware";

const router = Router();

// create subscriptions
router.post("/", verifyJWT, createSubscription);

// Get  subscriptions of the user
router.get("/mySubscriptions", verifyJWT, getMySubscription)

//Delete subscription
router.delete("/:id", verifyJWT, deleteSubscription);

//Exampe protected route for paper/test-series
router.get("/content/:id", verifyJWT, checkAccess, (req, res)=>{
    res.json({message : "You can access this content"})
});

export default router;
