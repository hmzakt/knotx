import { TestSeries } from "../models/testSeries.model.js";
import { Paper } from "../models/papers.model.js";
import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

// Create a new test series
export const createTestSeries = async (req, res) => {
  try {
    const { title, description, price, papers } = req.body;

    if (!title || !price) {
      return res
        .status(400)
        .json(new ApiError(400, "Title and price are required"));
    }

    const newSeries = await TestSeries.create({
      title,
      description,
      price,
      papers: papers || [],
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newSeries, "New test series creation successful"));
  } catch (error) {
    console.error("Error creating test series:", error);
    return res.status(500).json(new ApiError(500, "Server error", error));
  }
};

// Create a new paper
export const createPaper = async (req, res) => {
  try {
    const { title, subject, price, questions } = req.body;

    if (!title || !subject || !price) {
      return res
        .status(400)
        .json(
          new ApiError(400, "Title, subject, and price are compulsory")
        );
    }

    const newPaper = await Paper.create({
      title,
      subject,
      price,
      questions: questions || [],
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newPaper, "New paper created"));
  } catch (error) {
    console.error("Error while creating paper:", error);
    return res.status(500).json(new ApiError(500, "Server error", error));
  }
};

// Create a new question (can be reused in multiple papers)
export const createQuestion = async (req, res) => {
  try {
    const {
      text,
      options,
      explanation,
      difficulty,
      domain,
      paperId,
    } = req.body;

    if (!text || !options || !difficulty || !domain) {
      return res
        .status(400)
        .json(new ApiError(400, "Required fields are missing"));
    }

    const newQuestion = await Question.create({
      text,
      options,
      explanation,
      difficulty,
      domain,
    });

    if (paperId) {
      await Paper.findByIdAndUpdate(paperId, {
        $push: { questions: newQuestion._id },
      });
    }

    return res
      .status(201)
      .json(new ApiResponse(201, newQuestion, "New question created"));
  } catch (error) {
    console.error("Error creating question:", error);
    return res.status(500).json(new ApiError(500, "Server error", error));
  }
};
