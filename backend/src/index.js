// require('dotenv').config({path : './env'})
import dotenv from "dotenv"
// dotenv.config({
//     path: '../.env'
// })

dotenv.config();

import connectDB from "./db/index.js"
import { app } from "./app.js"



const getValidPort = () => {
    const raw = process.env.PORT;
    // Treat empty string or non-numeric as invalid
    const parsed = Number(raw);
    if (!raw || Number.isNaN(parsed) || parsed < 0 || parsed > 65535) {
        const fallback = 8000;
        console.warn(`Invalid PORT env '${raw ?? ''}'. Falling back to ${fallback}.`);
        return fallback;
    }
    return parsed;
};

const PORT = getValidPort();

connectDB()
  .then(() => {
    app.listen(PORT, () => {
        console.log(`Server started and connected to DB!`);
        console.log(`Listening on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error:\n", err);
  });




















// import express from "express"

// const app = express()
// // try catch me wrap karo already when using database
// //database se baat karo async await lagao

// (async ()=>{
// try{
//    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//    app.on("error",(err)=>{
//     console.log("Error : ",err)
//     throw err
//    })
//    app.listen(process.env.PORT(),()=>{
//     console.log(`Server started on PORT :  ${process.env.PORT}`);
// })
// }

// catch (error){
//     console.error("ERROR : ", error)
//     throw error;
// }
// })()