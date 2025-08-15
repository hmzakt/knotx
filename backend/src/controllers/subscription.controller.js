import { Paper } from "../models/papers.model";
import { Subscription } from "../models/subscription.model";
import { TestSeries } from "../models/testSeries.model";

// creates a new subscription 
export const createSubscription = async (req, res) => {
    try {
        const { type, itemId, startDate, endDate } = req.body;
        const userId = req.user._id;

        if (type === "all-access") {
            if (itemId) {
                return res.status(400).json({
                    message: "itemId should not be provided for all-access subscriptions"
                });
            }
        } else {
            if (!itemId) {
                return res.status(400).json({
                    message: "itemId is required for this subscription type"
                });
            }

            if (type === "single-paper") {
                const exists = await Paper.exists({ _id: itemId });
                if (!exists) {
                    return res.status(404).json({ message: "Paper not found" });
                }
            } else if (type === "test-series") {
                const exists = await TestSeries.exists({ _id: itemId });
                if (!exists) {
                    return res.status(404).json({ message: "Test series not found" });
                }
            } else {
                return res.status(400).json({ message: "Invalid subscription type" });
            }
        }

        const now = new Date();
        const dup = await Subscription.findOne({
            userId,
            type,
            ...(type !== "all-access" ? { itemId } : {}),
            status: "active",
            endDate: { $gte: now }
        });

        if (dup) {
            return res.status(409).json({ message: "Active subscription already exists" });
        }

        // Create subscription
        const subscription = await Subscription.create({
            userId,
            type,
            itemId: type === "all-access" ? null : itemId,
            startDate,
            endDate,
            status: "active"
        });

        res.status(201).json({
            message: "Subscription created successfully",
            subscription
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



//Gets subscriptions for logged in users
export const getMySubscription = async (req, res) => {
    try{
        const subscriptions = await Subscription.find({userId : req.user._id}).sort({createdAt : -1});
        res.status(200).json(subscriptions);
    } catch(err){
        res.status(500).json({message : err.message})
    }
};

//Delete a subscription can be carried out by admin or owner only
export const deleteSubscription = async(req, res) => {
    try{
        const {id} = req.params;
        const subscription= await Subscription.findById(id);

        if(!subscription){
            return res.status(404).json({message : "Subscription not found"});
        }

        if(subscription.userId.toString() != req.user._id.toString() && req.user.role !== "admin"){
            return res.status(403).json({message : "Unauthorized"});
        }

        await subscription.deleteOne();
        res.status(200).json({message : "Subscriptions deleted successfully"})
    }
    catch(err){
        return res.status(200).json({message : err.message})
    }
};