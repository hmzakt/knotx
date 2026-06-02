import { Subscription } from "../models/subscription.model.js";

export const expireSubscriptions = async () => {
    try {
        const now = new Date();

        const result = await Subscription.updateMany(
            {
                endDate: { $lt: now },
                status: "active",
            },
            {
                $set: { status: "expired" },
            }
        );

        console.log(
            `[Subscription expiry job] Updated ${result.modifiedCount} subscriptions to expired`
        );

        return result;
    } catch (error) {
        console.error("[Subscription expiry job error]: ", error);
        throw error;
    }
};