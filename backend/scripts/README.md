Backfill attempt.durationSec

This is a one-time migration script that populates `durationSec` on in-progress Attempt documents from the referenced Paper's `durationSec`.

Run from the repository root (ensure `MONGODB_URI` and other env vars are set, e.g., via your .env):

PowerShell

node backend/scripts/backfillAttemptDuration.js

Notes:
- The script connects using the same DB config as the app (uses `MONGODB_URI` + DB_NAME from constants).
- It only updates in-progress attempts that don't already have a positive `durationSec`.
- Safe to re-run; it will skip already populated attempts.
