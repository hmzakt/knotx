// require('dotenv').config({path : './env'})
import dotenv from "dotenv"
// dotenv.config({
//     path: '../.env'
// })

dotenv.config();

import connectDB from "./db/index.js"
import { app } from "./app.js"



const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
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