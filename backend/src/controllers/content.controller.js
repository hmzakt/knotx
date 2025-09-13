// PUBLIC apis so that we can dispaly the test series and papers

import { Paper } from "../models/papers.model.js";
import { Question } from "../models/question.model.js";
import { TestSeries } from "../models/testSeries.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const listPapers = async(req, res) => {
    try{
        const papers = await Paper.find({})
    .select("title subject price durationSec createdAt updatedAt")
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

export const listQuestions = async (req, res) => {
  try {
    const questions = await Question.find({})
      .select("text options difficulty domain createdAt updatedAt")
      .lean();

    return res
      .status(200)
      .json(new ApiResponse(200, questions, "Questions listed"));
  } catch (err) {
    console.error("list questions error:", err);
    return res.status(500).json(new ApiError(500, "Server error"));
  }
};

export const getPaperWithQuestions = async (req, res) => {
  try {
    const paperId = req.params.id;
    
    const paper = await Paper.findById(paperId).populate({
      path: "questions",
      select: "text options difficulty domain createdAt updatedAt"
    });

    if (!paper) {
      return res.status(404).json(new ApiError(404, "Paper not found"));
    }

    // Sanitize: ensure options contain only optionText (no isCorrect) and drop explanations
    const sanitizedQuestions = paper.questions.map(q => ({
      _id: q._id,
      text: q.text,
      options: q.options.map(opt => ({ optionText: opt.optionText })),
      difficulty: q.difficulty,
      domain: q.domain,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }));

    const sanitizedPaper = {
      _id: paper._id,
      title: paper.title,
      subject: paper.subject,
      price: paper.price,
      durationSec: paper.durationSec || 0,
      createdAt: paper.createdAt,
      updatedAt: paper.updatedAt,
      questions: sanitizedQuestions
    };

    return res.status(200).json(new ApiResponse(200, sanitizedPaper, "Paper fetched"));
  } catch (err) {
    console.error("getPaperWithQuestions error:", err);
    return res.status(500).json(new ApiError(500, "Server error while fetching paper with questions"));
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

// Get all test series with papers for admin
export const listTestSeriesWithPapers = async(req, res) => {
    try{
        const series = await TestSeries.find({})
            .populate({
                path: "papers",
                select: "title subject price createdAt updatedAt"
            })
            .select("title description price papers createdAt updatedAt")
            .lean();
        return res.status(200).json(new ApiResponse(200, series, "Test series with papers listed"));
    } catch(err){
        console.error("list test series with papers error : ", err);
        return res.status(500).json(new ApiError(500, "Server error"))
    }
};

// Get all papers with questions for admin
export const listPapersWithQuestions = async(req, res) => {
    try{
        const papers = await Paper.find({})
            .populate({
                path: "questions",
                select: "text options difficulty domain createdAt updatedAt"
            })
            .select("title subject price questions createdAt updatedAt")
            .lean();
        return res.status(200).json(new ApiResponse(200, papers, "Papers with questions listed"));
    } catch(err){
        console.error("list papers with questions error : ", err);
        return res.status(500).json(new ApiError(500, "Server error"))
    }
};

// Get test series with papers for admin (no subscription required)
export const getTestSeriesWithPapersForAdmin = async(req, res) => {
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
            .json(new ApiResponse(200, series, "Test series fetched for admin"));
    } catch (err) {
        console.error("getTestSeriesWithPapersForAdmin error:", err);
        return res.status(500).json(new ApiError(500, "Server error"));
    }
};