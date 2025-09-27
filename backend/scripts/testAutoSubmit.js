#!/usr/bin/env node
import connectDB from '../src/db/index.js';
import { autoSubmitAttempt } from '../src/controllers/attempts.controller.js';

const id = process.argv[2];
if(!id){
  console.error('Usage: node backend/scripts/testAutoSubmit.js <attemptId>');
  process.exit(2);
}

const run = async () => {
  try{
    await connectDB();
    console.log('Connected');
    const res = await autoSubmitAttempt(id);
    console.log('Result:', res);
    process.exit(0);
  } catch(e){
    console.error('Error', e);
    process.exit(2);
  }
}

run();
