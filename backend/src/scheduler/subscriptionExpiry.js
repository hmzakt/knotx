
import cron from "node-cron"
import { Subscription } from "../models/subscription.model";


export const startSubscriptionExpiryJob = () => {
    // We set it to run at midnight

    cron.schedule("0 0 * * *", async () => {
        try {
            const now = new Date();

            const result = await Subscription.updateMany({
                endDate: { $lt: now },
                status: "active"
            },
                { $set: { status: "expired" } }
            );
            console.log(`[Subscription expiry job] updated ${result.modifiedCount} subscriptons to expired`)
        } catch(error){
            console.error("[Susbscription expiry job error : ", error)
        }
    });
};