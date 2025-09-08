import { TestSeries } from "../models/testSeries.model.js";
import { Paper } from "../models/papers.model.js";
import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

// Update an existing paper (title/subject/price and questions list)
export const updatePaper = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, price, questions } = req.body;

    const paper = await Paper.findById(id);
    if (!paper) {
      return res.status(404).json(new ApiError(404, "Paper not found"));
    }

    if (title !== undefined) paper.title = title;
    if (subject !== undefined) paper.subject = subject;
    if (price !== undefined) paper.price = price;

    if (questions !== undefined) {
      if (!Array.isArray(questions)) {
        return res.status(400).json(new ApiError(400, "questions must be an array"));
      }
      // Set questions to provided ids (add/remove accordingly)
      paper.questions = questions;
    }

    await paper.save();
    return res
      .status(200)
      .json(new ApiResponse(200, paper, "Paper updated successfully"));
  } catch (error) {
    console.error("Error updating paper:", error);
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

// Delete a test series
export const deleteTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testSeries = await TestSeries.findById(id);
    if (!testSeries) {
      return res.status(404).json(new ApiError(404, "Test series not found"));
    }

    await TestSeries.findByIdAndDelete(id);
    
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Test series deleted successfully"));
  } catch (error) {
    console.error("Error deleting test series:", error);
    return res.status(500).json(new ApiError(500, "Server error", error));
  }
};

// Promote user to admin
export const promoteToAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = 'admin';
  await user.save();

  res.json({ success: true, message: 'User promoted to admin' });
});
