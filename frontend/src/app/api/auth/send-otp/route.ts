import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { canSend, upsertOtp } from "../_otpStore";
import { createChallenge } from "../_otpToken";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email required" },
        { status: 400 }
      );
    }

    const gate = canSend(email);
    if (!gate.allowed) {
      return NextResponse.json(
        { success: false, message: "Please wait before requesting a new OTP.", retryAfterMs: gate.retryAfterMs },
        { status: 429 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const { expiresInMs, retryAfterMs } = upsertOtp(email, otp);

    try {
      const senderStrategy = (process.env.EMAIL_SENDER || "auto").toLowerCase(); // emailjs | smtp | auto
      // First choice: EmailJS REST API if configured
      const emailjsServiceId = process.env.EMAILJS_SERVICE_ID;
      const emailjsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
      const emailjsPublicKey = process.env.EMAILJS_PUBLIC_KEY; // user_id
      const emailjsAccessToken = process.env.EMAILJS_ACCESS_TOKEN; // optional
      const requestOrigin = (request.headers as any).get?.("origin") || process.env.EMAILJS_ORIGIN;

      const sentViaEmailJS = async () => {
        if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) return false;
        // Server-side calls require a private access token per EmailJS policy
        if (!emailjsAccessToken) {
          return { ok: false as const, status: 400, details: "EMAILJS_ACCESS_TOKEN is required for server-side usage." };
        }
        const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(requestOrigin ? { Origin: requestOrigin } : {}),
          },
          body: JSON.stringify({
            service_id: emailjsServiceId,
            template_id: emailjsTemplateId,
            user_id: emailjsPublicKey,
            accessToken: emailjsAccessToken,
            template_params: {
              to_email: email,
              otp,
              expires_in_minutes: Math.floor(expiresInMs / 60000),
              from_name: process.env.APP_NAME || "KnotX",
            },
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.warn("EmailJS send failed:", res.status, text);
          return { ok: false as const, status: res.status, details: text };
        }
        return { ok: true as const };
      };

      let didEmailJS: false | { ok: true } | { ok: false; status: number; details: string } = false;
      if (senderStrategy === "emailjs") {
        didEmailJS = await sentViaEmailJS();
        if (!didEmailJS || didEmailJS.ok === false) {
          return NextResponse.json(
            {
              success: false,
              message: "EmailJS send failed. Check EmailJS credentials, template, and variables.",
              details: typeof didEmailJS === "object" && "details" in didEmailJS ? didEmailJS.details : undefined,
            },
            { status: typeof didEmailJS === "object" && "status" in didEmailJS ? didEmailJS.status : 502 }
          );
        }
      } else if (senderStrategy === "auto") {
        didEmailJS = await sentViaEmailJS();
      }

      if ((!didEmailJS || didEmailJS.ok === false) && senderStrategy !== "emailjs") {
        // Second choice: SMTP (Nodemailer)
        const smtpUrl = process.env.SMTP_URL;
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
        const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : undefined;
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

        let transporter: nodemailer.Transporter | null = null;
        if (smtpUrl) {
          transporter = nodemailer.createTransport(smtpUrl);
        } else if (smtpHost && smtpPort && typeof smtpSecure === "boolean" && smtpUser && smtpPass) {
          transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: { user: smtpUser, pass: smtpPass },
          });
        }

        if (transporter) {
          const from = process.env.SMTP_FROM || smtpUser || "no-reply@example.com";
          const info = await transporter.sendMail({
            from,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}. It will expire in ${Math.floor(expiresInMs / 60000)} minutes.`,
          });
          // Optional log
          if (typeof (nodemailer as any).getTestMessageUrl === "function") {
            const url = (nodemailer as any).getTestMessageUrl(info);
            if (url) console.log("Ethereal preview URL:", url);
          }
        } else {
          // Dev fallback: use ethereal test account for preview emails
          const testAccount = await nodemailer.createTestAccount();
          const etherealTransport = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          const info = await etherealTransport.sendMail({
            from: process.env.SMTP_FROM || "No Reply <no-reply@example.com>",
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}. It will expire in ${Math.floor(expiresInMs / 60000)} minutes.`,
          });
          const previewUrl = nodemailer.getTestMessageUrl(info);
          console.warn("SMTP not configured. Used Ethereal test account; no real email sent.");
          if (previewUrl) console.log("Ethereal preview URL:", previewUrl);
        }
      }
    } catch (err) {
      console.error("Send OTP email error:", err);
      // don't expose details; still report success so client flow continues with email delivery best-effort
    }

  // Return signed challenge token (no raw OTP) so verification doesn't depend on server memory instance
  const challenge = createChallenge(email, otp, expiresInMs);
  return NextResponse.json({ success: true, expiresInMs, retryAfterMs, challenge });
  } catch (err) {
    console.error("Send OTP route error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to process request" },
      { status: 500 }
    );
  }
}
