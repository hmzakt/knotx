import express from "express";
import { expireSubscriptions } from "../scheduler/subscriptionExpiry.js";

const router = express.Router();

router.get("/expire-subscriptions", async (req, res) => {
    try {
        if (
            req.headers.authorization !== process.env.CRON_SECRET
        ) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const result = await expireSubscriptions();

        res.status(200).json({
            success: true,
            modified: result.modifiedCount,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export default router;