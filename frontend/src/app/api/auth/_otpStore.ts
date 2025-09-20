type OtpRecord = {
  otp: string;
  expiresAt: number; // epoch ms
  attemptsLeft: number;
  lastSentAt: number; // epoch ms
};

// In-memory OTP store. For true production, swap to Redis/DB.
const store = new Map<string, OtpRecord>();

// Configs (env-driven with sensible defaults)
const OTP_TTL_MS = (process.env.OTP_TTL_SECONDS ? Number(process.env.OTP_TTL_SECONDS) : 300) * 1000; // default 5 minutes
const RESEND_COOLDOWN_MS = (process.env.OTP_COOLDOWN_SECONDS ? Number(process.env.OTP_COOLDOWN_SECONDS) : 60) * 1000; // default 60 seconds
const MAX_ATTEMPTS = 5;

export function canSend(email: string) {
  const rec = store.get(email);
  if (!rec) return { allowed: true } as const;
  const now = Date.now();
  if (now - rec.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitMs = RESEND_COOLDOWN_MS - (now - rec.lastSentAt);
    return { allowed: false, retryAfterMs: waitMs } as const;
  }
  return { allowed: true } as const;
}

export function upsertOtp(email: string, otp: string) {
  const now = Date.now();
  const record: OtpRecord = {
    otp,
    expiresAt: now + OTP_TTL_MS,
    attemptsLeft: MAX_ATTEMPTS,
    lastSentAt: now,
  };
  store.set(email, record);
  return { expiresInMs: OTP_TTL_MS, retryAfterMs: RESEND_COOLDOWN_MS };
}

export function verifyOtp(email: string, otp: string) {
  const rec = store.get(email);
  const now = Date.now();
  if (!rec) return { ok: false, reason: "not_found" } as const;
  if (now > rec.expiresAt) {
    store.delete(email);
    return { ok: false, reason: "expired" } as const;
  }
  if (rec.attemptsLeft <= 0) {
    store.delete(email);
    return { ok: false, reason: "too_many_attempts" } as const;
  }
  rec.attemptsLeft -= 1;
  if (otp !== rec.otp) {
    store.set(email, rec);
    return { ok: false, reason: "mismatch", attemptsLeft: rec.attemptsLeft } as const;
  }
  // success: consume OTP
  store.delete(email);
  return { ok: true } as const;
}

export function getConfig() {
  return { ttlMs: OTP_TTL_MS, cooldownMs: RESEND_COOLDOWN_MS, maxAttempts: MAX_ATTEMPTS };
}
