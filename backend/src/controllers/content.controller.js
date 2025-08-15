


// PUBLIC apis so that we can dispaly the test series and papers

import { Paper } from "../models/papers.model";
import { TestSeries } from "../models/testSeries.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";

export const listPapers = async(req, res) => {
    try{
        const papers = await Paper.find({})
        .select("title subject price createdAt updatedAt")
        .lean();

        return res.status(200)
        .json(new ApiResponse(200, papers, "Paper listed"));
    } catch(err){
        console.error("listed papers error : ", err);
        return res.status(500).json(new ApiError(500, "Server Error"))
    }
};

export const listTestSeries = async(req, res) => {
    try{
        const series = await TestSeries.aggregate([
            {
                $project : {
                    title : 1,
                    description : 1,
                    price : 1,
                    createdAt : 1,
                    updatedAt : 1,
                    papersCount : {$size : {$ifNull : ["$papers",[]]}}
                }
            },
           { $sort : {createdAt : -1} } 
        ]);
        return res.status(200).json(new ApiResponse(200, series, "test series listed"));
    } catch(err){
        console.error("list test series error : ", err);
        return res.status(500).json(new ApiError(500, "Server error"))
    }
};


///// Subscriptions required
// get a paper with question

export const getPaperWithQuestions = async (req, res) => {
    try {
        const paperId = req.params.id;

        const paper = await Paper.findById(paperId).populate({
            path : "questions",
            select : "text options explanation difficulty domain createdAt updatedAt"
        });

        if(!paper) {
            return res.status(404).json(new ApiError(404, "message not found"));
        }

        return res.status(200).json(
            new ApiResponse(200, paper, "paper fetched")
        )
    }
    catch(err){
        console.error("error fetching getQuestions with paper :", err);
        return res.status(500).json(new ApiError(500, "Server error while fetching paper with questions"))
    }
};

export const getTestSeriesWithPapers = async(req, res)=>{
    try {
    const seriesId = req.params.id;

    const series = await TestSeries.findById(seriesId)
      .populate({
        path: "papers",
        select: "title subject price createdAt updatedAt"
      });

    if (!series) {
      return res.status(404).json(new ApiError(404, "Test series not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, series, "Test series fetched"));
  } catch (err) {
    console.error("getTestSeriesWithPapers error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};