/*
Snapshot sub schemas : 
We are storing frozen sub-schmeas of each question( text + options + correctIndex) as soon as attempt starts
So that even if question is edited later, scoring is still proper
*/

import mongoose from "mongoose";

// Option snapshot schema does not contains isCorrect

const OptionSnapshotSchema = new mongoose.Schema({
    optionText: {
        type: String,
        required: true
    }
}, { _id: false })

const QuestionSnapshotSchema = new mongoose.Schema({
    questionId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Question",
        required : true
    },

    text : {
        type : String,
        required : true
    },

    options : {
        type : [OptionSnapshotSchema],
        required : true
    },

    correctIndex : {
        type : Number,
        required : true
    }
}, {_id : false});

/* 
Answer Schema stores the particular question in an attempt
selected Index is null when unanswered
answered at can help for analytics like time taken and all which we can compare further to give proper response to user to help him improve
*/

const AnswerSchema = new mongoose.Schema({
    questionId : {
        type :  mongoose.Schema.Types.ObjectId,
        ref : "Question",
        required : true
    },
    selectedIndex : {
        type : Number,
        default : null
    },
    answeredAt : {
        type : Date,
        default : Date.now
    }
}, {_id : false});

/*
Attempt Schrma stores the data for attempt
like status is inprogress or submitted
per-attempt scoring parameters if we have done any change
prevents multiple attempts at same time
*/

const AttemptSchema  = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
        index : true
    },
    paperId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Paper",
        required : true,
        index : true
    },

    questionSnapshot : {
        type : [QuestionSnapshotSchema],
        required : true
    },

    answers : {
        type : [AnswerSchema], 
        default : []
    },

    score : {
        type : Number,
        default : 0,  //final score after submission
        required : true
    },

    totalQuestions : {
        type : Number
    },

    status : {
        type : String,
        enum : ["in-progress", "submitted"],
        default : "in-progress"
    },

    startedAt : {
        type : Date,
        default : Date.now
    },

    submittedAt : {
        type  : Date
    },

    durationSec : {
        type : Number
    },

    meta : {
        marksPerQ : {
            type : Number,
            default : 1
        },
        negativeMark : {
            type : Number,
            default : 0
        }
    }
}, {timestamps : true});

// helps find existing in-progress quickly and prevent duplicates
AttemptSchema.index({userId : 1, paperId : 1, status : 1});

//Index for listing a user's attempt quickly
AttemptSchema.index({userId : 1, createdAt : -1});

export const Attempt = mongoose.model("Attempt", AttemptSchema);