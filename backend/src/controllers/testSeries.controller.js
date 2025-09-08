import { Paper } from "../models/papers.model.js";
import { TestSeries } from "../models/testSeries.model.js";


export const addPaperToTestSeries = async(req, res) => {
    try{
        const {id} = req.params;
        const {paperId} = req.body;

        const testSeries = await TestSeries.findById(id);
        if(!testSeries) return res.status(404).json({message : "Test series not found"})

        const paper = await Paper.findById(paperId);
        if(!paper) return res.status(404).json({message : "Paper not found"})

        // idempotent add
        if (!testSeries.papers.some(p => p.toString() === paperId)) {
            testSeries.papers.push(paperId);
        }
        await testSeries.save();

        res.json({message : "Paper added to test series : ", testSeries});
    }catch(err){
        return res.status(500).json({error : err.message});
    }
};