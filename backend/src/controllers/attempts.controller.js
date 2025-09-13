/*
We are designing the controllers for start attempt
for v1
Endpoint to start attempt = POST api/v1/attempts/start/:paperId

Steps are :-
User is subscribed
Validate paper exists and has questions
Prevent duplicate attemps for sae user + paper
snapshot questions (text + question + correctIndex ) into Attempt
Return sanitized questions to client, that is correct index must be hideen
*/

import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { Paper } from "../models/papers.model.js";
import { Attempt } from "../models/attempts.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const startAttempt = async (req, res) => {
    try {
        const userId = req.user._id;
        const paperId = req.params.paperId;

        if (!mongoose.isValidObjectId(paperId)) {
            return res.status(400).json(new ApiError(400, "Invalid paperId"));
        }

        const paper = await Paper.findById(paperId).populate({
            path: "questions"
        });

        if (!paper) return res.status(404).json(new ApiError(404, "PaperNot found"));

        if (!paper.questions || paper.questions.length === 0) {
            return res.status(400).json(new ApiError(400, "Paper has no questions"));
        }

        const existing = await Attempt.findOne({
            userId,
            paperId,
            status: "in-progress"
        });

        if (existing) {
            return res.status(409).json(new ApiError(409, "There is already an in-attempt paper for this id"))
        }

        const questionSnapshot = paper.questions.map(q => {
            const optionsSnap = q.options.map(
                opt => ({
                    optionText: opt.optionText
                })
            );

            const correctIndex = q.options.findIndex(opt => !!opt.isCorrect);

            return {
                questionId: q._id,
                text: q.text,
                options: optionsSnap,
                correctIndex: correctIndex >= 0 ? correctIndex : -1
            };
        });

        const totalQuestions = questionSnapshot.length;

        const metaFromBody = req.body?.meta || {};
        const marksPerQ = Number(metaFromBody.marksPerQ ?? 1);
        const negativeMark = Number(metaFromBody.negativeMark ?? 0);


        const attempt = await Attempt.create({
            userId,
            paperId,
            questionSnapshot,
            totalQuestions,
            meta: { marksPerQ, negativeMark },
            status: "in-progress",
            startedAt: new Date()
        });

        const sanitized = questionSnapshot.map(q => ({
            questionId: q.questionId,
            text: q.text,
            options: q.options.map((opt, idx) => ({
                index: idx,
                optionText: opt.optionText
            }))
        }));

        return res.status(201).json(new ApiResponse(201, {
            attemptId: attempt._id,
            paperId,
            totalQuestions,
            questions: sanitized,
            durationSec: paper.durationSec || 0,
            startedAt: attempt.startedAt,
            remainingSec: paper.durationSec ? Number(paper.durationSec) : null
        }, "Attempt started"));
    } catch (err) {
        console.error("Start attempt error : ", err);
        return res.status(500).json(new ApiError(500, "server error", err));
    }
};

/**
 *  The next controller we write is Answer question
 * THE API WE PLAN FOR THIS IS POST api/v1/attempts/:attemptId/answer
 * 
 * Steps are : -
 * Validate ownership and in-progress status
 * validate that questionId belongs to the snapshot and selected Index is in-range
 * Insert into attempt.answer array
 */

export const answerQuestion = async (req, res) => {
    try {
        const userId = req.user._id;
        const { attemptId } = req.params;
        const { questionId, selectedIndex } = req.body;

        if (!mongoose.isValidObjectId(attemptId) ||
            !mongoose.isValidObjectId(questionId)
        ) {
            return res.status(400).json(new ApiError(400, "Invalid Ids"))
        }

        const attempt = await Attempt.findById(attemptId);
        if(!attempt) return res.status(400).json(new ApiError(404, " attempt not found"));

        if(attempt.userId.toString() !== userId.toString()){
            return res.status(403).json(new ApiError(403, "No attempt owner"));
        }

        if(attempt.status !== "in-progress"){
            return res.status(400).json(new ApiError(400, "No in progress attempt found"));
        }

        const queSnap = attempt.questionSnapshot.find( q =>  q.questionId.toString() === questionId.toString());
        if(!queSnap) return res.status(400).json(new ApiError(400, "Question does not belong to this attempt"));

        if(selectedIndex != null && selectedIndex != undefined){
            if(typeof selectedIndex !== "number" || selectedIndex < 0 || selectedIndex > 3){
                return res.status(400).json(new ApiError(400, "SelectedIndex out of range"));
            }
        }

        const idx = attempt.answers.findIndex( a => a.questionId.toString() === questionId.toString());
        if ( idx >= 0){
            attempt.answers[idx].selectedIndex = (selectedIndex === null || selectedIndex === undefined) ? null : selectedIndex;
            attempt.answers[idx].answeredAt = new Date();
        }
        else {
            attempt.answers.push({
                questionId,
                selectedIndex : (selectedIndex === null || selectedIndex === undefined) ? null : selectedIndex,
                answeredAt : new Date()
            });
        }

        await attempt.save();
        return res.status(200).json( new ApiResponse (200 , {attemptId : attempt._id}, "Answer recorded"));
    } catch (err){
        console.error("QuestionAnswered error  : ", err);
        return res.status(500).json(new ApiError(500, "Server error while answerQuestion", err))
    }
};


/**
 * SUBMIT AN ATTEMPT
 * ENDPOINT WILL BE /api/v1/attempts/:attempId/submit
 * 
 * Steps taken :-
 * Validate ownership and in-progress status
 * Compute score server-side using the snapshots correct index to avoid leak
 * apply negative marking if configured in attempt.meta
 * save score, mark, submittedAt, compute duration
 * Return breakdown with correct Index 
 */

export const submitAttempt = async (req, res) =>{
    try{
    const userId = req.user._id;
        const { attemptId } = req.params;

        if(!mongoose.isValidObjectId(attemptId)){
            return res.status(400).json(new ApiError(400, "Invalid AttemptId"));
        }

        const attempt = await Attempt.findById(attemptId);
        if(!attempt) return res.status(404).json(new ApiError(404, "Attempt not found"));
        if(attempt.userId.toString()!==userId.toString()) return res.status(403).json(new ApiError(403, "Not owner"));
        if(attempt.status !== "in-progress") return res.status(400).json(new ApiError(400, "No ongoing attempt found"));

        const marksPerQ = Number(attempt.meta?.marksPerQ ?? 1);
        const negative = Number(attempt.meta?.negativeMark ?? 0);

        const answerMap = {};
        attempt.answers.forEach( a=> {
            answerMap[a.questionId.toHexString()] = (typeof a.selectedIndex === "number")?a.selectedIndex : null;
        });

        let score = 0;
        const breakdown = [];

        for (const q of attempt.questionSnapshot){
            const qid = q.questionId.toString();
            const selected = (qid in answerMap)? answerMap[qid] : null;
            const correctIndex = Number(q.correctIndex);

            let correct = false;
            if(selected !== null && selected === correctIndex){
                correct = true;
                score += marksPerQ;
            }
            else if (selected === null || selected === undefined){}
            else {
                if (negative && !isNaN(negative)) score -= negative;
            }

            breakdown.push({
                questionId : q.questionId,
                selectedIndex : selected,
                correctIndex,
                correct
            });
        }
        attempt.score = score;
        attempt.status = "submitted";
        attempt.submittedAt = new Date();

        // compute duration in seconds
        attempt.durationSec = Math.floor((attempt.submittedAt - attempt.startedAt)/1000);

        // enforce paper time limit if configured
        try {
            const paper = await Paper.findById(attempt.paperId).select('durationSec');
            const allowed = Number(paper?.durationSec ?? 0);
            if (allowed > 0 && attempt.durationSec > allowed) {
                // mark submitted to prevent further submissions and save state
                attempt.status = 'submitted';
                attempt.score = 0; // no credit for late submission
                await attempt.save();
                return res.status(400).json(new ApiError(400, 'Time limit exceeded; attempt auto-submitted'));
            }
        } catch (e) {
            // if paper fetch fails, continue to save normally
            console.error('Could not verify paper duration:', e);
        }

        await attempt.save();

        return res.status(200).json(new ApiResponse(200 , {
            attemptId : attempt._id,
            score,
            total : attempt.totalQuestions,
            percent : (attempt.totalQuestions > 0) ? (score / (attempt.totalQuestions * marksPerQ) * 100) : 0,
            breakdown 
        }, "attempt submitted and scoreed"));
    }catch (err){
        console.error("Submission error : ", err);
        return res.status(500).json(new ApiError(500, "Server error", err));
    }
};

// next two functions are gpt-coded, check once 

/**
 * GET ATTEMPT
 * - Endpoint: GET /api/v1/attempts/:attemptId
 * - Behavior:
 *    - If in-progress: return question list WITHOUT correctIndex and current answers.
 *    - If submitted: return breakdown including correctIndex (review mode).
 */
export const getAttempt = async (req, res) => {
  try {
    const userId = req.user._id;
    const { attemptId } = req.params;

    if (!mongoose.isValidObjectId(attemptId)) {
      return res.status(400).json(new ApiError(400, "Invalid attemptId"));
    }

    const attempt = await Attempt.findById(attemptId).lean();
    if (!attempt) return res.status(404).json(new ApiError(404, "Attempt not found"));

    // Ownership or admin allowed to fetch
    if (attempt.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      return res.status(403).json(new ApiError(403, "Not attempt owner"));
    }

        if (attempt.status === "in-progress") {
      // Return sanitized questions (no correctIndex)
            const questions = attempt.questionSnapshot.map(q => ({
                questionId: q.questionId,
                text: q.text,
                options: q.options.map((o, idx) => ({ index: idx, optionText: o.optionText }))
            }));

            // compute remaining seconds from paper.durationSec if available
                    let remainingSec = null;
            try {
                const paper = await Paper.findById(attempt.paperId).select('durationSec');
                const allowed = Number(paper?.durationSec ?? 0);
                if (allowed > 0) {
                    const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
                            remainingSec = Math.max(allowed - elapsed, 0);
                }
            } catch (e) {
                console.error('Could not compute remainingSec for attempt:', e);
            }

            return res.status(200).json(new ApiResponse(200, {
                attemptId: attempt._id,
                paperId: attempt.paperId,
                status: attempt.status,
                startedAt: attempt.startedAt,
                totalQuestions: attempt.totalQuestions,
                questions,
                answers: attempt.answers,
                remainingSec
            }, "Attempt fetched (in-progress)"));
    } else {
      // Submitted => show breakdown including correctIndex (safe)
      const breakdown = attempt.questionSnapshot.map(q => {
        const ans = attempt.answers.find(a => a.questionId.toString() === q.questionId.toString());
        return {
          questionId: q.questionId,
          text: q.text,
          options: q.options.map((o, idx) => ({ index: idx, optionText: o.optionText })),
          selectedIndex: ans ? ans.selectedIndex : null,
          correctIndex: q.correctIndex
        };
      });

      return res.status(200).json(new ApiResponse(200, {
        attemptId: attempt._id,
        paperId: attempt.paperId,
        status: attempt.status,
        score: attempt.score,
        total: attempt.totalQuestions,
        submittedAt: attempt.submittedAt,
        durationSec: attempt.durationSec,
        breakdown
      }, "Attempt fetched (submitted)"));
    }
  } catch (err) {
    console.error("getAttempt error:", err);
    return res.status(500).json(new ApiError(500, "Server error", err));
  }
};

/**
 * LIST MY ATTEMPTS
 * - Endpoint: GET /api/v1/attempts
 * - Returns lightweight list for dashboard/history
 */
export const listMyAttempts = async (req, res) => {
  try {
    const userId = req.user._id;
    const attempts = await Attempt.find({ userId })
      .select("paperId score status startedAt submittedAt totalQuestions durationSec")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(new ApiResponse(200, attempts, "User attempts fetched"));
  } catch (err) {
    console.error("listMyAttempts error:", err);
    return res.status(500).json(new ApiError(500, "Server error", err));
  }
};