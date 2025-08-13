import mongoose, { Schema } from "mongoose";

const optionSchema = new Schema({
    optionText: {
        type: String,
        required: true
    },
    isCorrect: {
        type: Boolean,
        default: false
    }
});

const questionSchema = new Schema(
    {
        text : {
            type : String,
            required : true,
            trim : true
        },
        options : {
            type : [optionSchema],
            validate : {
                validator : function (val){
                    return val.length >=4
                },
                message : "A question must have atleast 4 options"
            },
            explanation : {
                type : String
            },
            difficulty : {
                type : String,
                enum : ["easy", "medium", "hard"],
                required : true
            },
            domain : {
                type : String,
                required : true
            }
        }         
    },
    {timestamps : true}
);

export const Question = mongoose.model("Question", questionSchema)