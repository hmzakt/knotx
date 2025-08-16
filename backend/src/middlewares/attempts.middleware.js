/**
 *requires attempt owner 
 * Ensures that the requestor is owner or admin
 * Use this on answer/submit/get attempt routes for access control
 */

import { Attempt } from "../models/attempts.model.js";
import { ApiError } from "../utils/apiError.js";


 export const requireAttemptOwner = async(req, res, next) => {
    try{
        const attemptId = req.params.attemptId || req.params.id;
        if(!attemptId) return res.status(400).json(new ApiError(400, "Attempt Id required"));

        const attempt = await Attempt.findById(attemptId).select("userId").lean();
        if (!attempt) return res.status(404).json(new ApiError(404, "Attempt not found"));

        if(attempt.userId.toString() !== req.user._id.toString() && req.user.role !== "admin"){
            return res.status(403).json(new ApiError(403, "No attempt owner or admin"));
        }

        next();
    }
    catch (err){
        console.error("require Attempt Owner : ", err);
        return res.status(500).json( new ApiError(500, "Server error", err))
    }
};