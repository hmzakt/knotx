import { Paper } from "../models/papers.model";
import { Question } from "../models/question.model";


export const updateQuestion = async (req, res) => {
    try{
        const {id} = req.params;
        const updated = await Question.findByIdAndUpdate(id, req, ReportBody, {new : true});
        if(!updated) return res.json(404).json({message : "Question not found"});
        res.json(updated)
    } catch (err){
        res.status(500).json({error : err.message})
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const {id } = req.params;

        await Paper.updateMany({}, {$pull : {questions : id}});

        const deleted = await Question.findByIdAndDelete(id);
        if(!deleted) return res.status(404).json({message : "Question not found"});

        res.json({message : "Question deleted"})
    } catch(err){
        res.status(500).json({error : err.message})
    }
};