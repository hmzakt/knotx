#!/usr/bin/env node
// One-time migration: populate attempt.durationSec for in-progress attempts
import mongoose from 'mongoose';
import connectDB from '../src/db/index.js';
import { Attempt } from '../src/models/attempts.model.js';
import { Paper } from '../src/models/papers.model.js';

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB — starting backfill');

    const cursor = Attempt.find({ status: 'in-progress' }).cursor();
    let updated = 0;
    for (let attempt = await cursor.next(); attempt != null; attempt = await cursor.next()) {
      try {
        const cur = attempt;
        if (cur.durationSec && cur.durationSec > 0) continue; // already set
        const paper = await Paper.findById(cur.paperId).select('durationSec').lean();
        const duration = Number(paper?.durationSec ?? 0);
        if (duration && duration > 0) {
          await Attempt.updateOne({ _id: cur._id }, { $set: { durationSec: duration } });
          updated++;
          console.log('Backfilled attempt', cur._id.toString(), 'durationSec=', duration);
        }
      } catch (e) {
        console.error('Error processing attempt', attempt._id, e);
      }
    }

    console.log('Backfill complete — updated', updated, 'attempts');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(2);
  }
};

run();
