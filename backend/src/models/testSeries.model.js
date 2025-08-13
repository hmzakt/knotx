import mongoose , {Schema} from "mongoose";
import { stringify } from "node:querystring";

const testSeriesSchema = new Schema (
    {
        title : {
            type : String,
            required : true,
            trim : true
        },
        description : {
            type : String,
            trim : true
        },
        price : {
            type : Number,
            required : true
        },
        papers : [{
            type : Schema.Types.ObjectId,
            ref : "Paper"
        }]
    },
    {timestamps : true}
);

export const TestSeries = mongoose.model("TestSeries", testSeriesSchema)