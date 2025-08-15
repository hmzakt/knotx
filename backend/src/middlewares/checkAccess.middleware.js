import { Subscription } from "../models/subscription.model.js";


export const checkAccess = async(req, res, next) => {
    try{
        const userId = req.user._id;
        const { id } = req.params; // this is the id for paper/ test series

        const subscription = await Subscription.findOne({userId, status : "active"})

        if(!subscription){
            return res.status(403).json({message : "Active subscription not found"})
        }

        if(subscription.type === "all-access" && subscription.status === "active"){
            return next();
        }

        if(
            (subscription.type == "single-paper" && subscription.itemId.equals(id)) ||
            (subscription.type == "test-series" && subscription.itemId.equals(id))
        ){
            return next();
        }
        return res.status(403).json({message : "Access denied, Subscription not found"});
    } catch(err){
        res.status(500).json({message : err.message})
    }
}