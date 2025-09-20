import { NextResponse } from "next/server";
import { verifyChallenge } from "../_otpToken";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email, otp, challenge } = await request.json();
    if (!email || !otp || !challenge) {
      return NextResponse.json(
        { success: false, message: "Email, OTP and challenge token are required" },
        { status: 400 }
      );
    }

    const parsed = verifyChallenge(challenge);
    if (!parsed.ok) {
      const map: Record<string, { status: number; message: string }> = {
        format: { status: 400, message: "Invalid challenge format" },
        signature: { status: 401, message: "Invalid challenge signature" },
        payload: { status: 400, message: "Invalid challenge payload" },
        expired: { status: 410, message: "OTP expired" },
        error: { status: 400, message: "Challenge parse error" },
      };
      const entry = map[parsed.reason] ?? { status: 400, message: "Invalid challenge" };
      return NextResponse.json({ success: false, message: entry.message }, { status: entry.status });
    }

    if (parsed.email !== email) {
      return NextResponse.json({ success: false, message: "Email mismatch" }, { status: 400 });
    }
    if (parsed.otp !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
