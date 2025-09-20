import crypto from "crypto";

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(str: string) {
  const pad = 4 - (str.length % 4 || 4);
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad === 4 ? 0 : pad);
  return Buffer.from(base64, "base64");
}

function getSecret() {
  const secret = process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
  return Buffer.from(secret);
}

export function createChallenge(email: string, otp: string, ttlMs: number) {
  const exp = Date.now() + ttlMs;
  const payload = { email, otp, exp };
  const header = { alg: "HS256", typ: "OTP" };
  const encHeader = b64url(JSON.stringify(header));
  const encPayload = b64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest();
  const token = `${data}.${b64url(sig)}`;
  return token;
}

export function verifyChallenge(token: string) {
  try {
    const [encHeader, encPayload, encSig] = token.split(".");
    if (!encHeader || !encPayload || !encSig) return { ok: false as const, reason: "format" };
    const data = `${encHeader}.${encPayload}`;
    const expected = crypto.createHmac("sha256", getSecret()).update(data).digest();
    const actual = b64urlDecode(encSig);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return { ok: false as const, reason: "signature" };
    }
    const payload = JSON.parse(b64urlDecode(encPayload).toString());
    if (!payload || typeof payload !== "object") return { ok: false as const, reason: "payload" };
    const { email, otp, exp } = payload as { email: string; otp: string; exp: number };
    if (Date.now() > exp) return { ok: false as const, reason: "expired" };
    return { ok: true as const, email, otp };
  } catch {
    return { ok: false as const, reason: "error" };
  }
}
