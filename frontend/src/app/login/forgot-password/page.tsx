"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import Link from "next/link";
import OtpInput from "../../../components/otpInput";
import apiClient from "../../../lib/api";
import { Eye, EyeOff } from "lucide-react";

interface ForgotPasswordFormData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ForgotPasswordFormData>();
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // OTP related state
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [cooldownMs, setCooldownMs] = useState<number>(0);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPassword = watch("newPassword");

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const id = setInterval(() => setCooldownMs((ms) => (ms - 1000 <= 0 ? 0 : ms - 1000)), 1000);
    return () => clearInterval(id);
  }, [cooldownMs]);

  const sendOtp = async (email: string) => {
    if (!email) return;
    setIsSendingOtp(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpEmail(email);
        setOtpVerified(false);
        setVerifiedEmail(null);
        setExpiresInMs(data.expiresInMs ?? 60000);
        if (typeof data.retryAfterMs === "number") setCooldownMs(data.retryAfterMs);
        if (typeof data.challenge === "string") setChallenge(data.challenge);
        setCurrentStep("otp");
      } else {
        if (res.status === 429 && typeof data.retryAfterMs === "number") {
          setCooldownMs(data.retryAfterMs);
          setError(data.message || "Please wait before requesting a new OTP.");
        } else {
          setError(data.message || "Failed to send OTP");
        }
      }
    } catch (err) {
      setError("Failed to send OTP. Try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // When email changes: reset OTP UI
  useEffect(() => {
    if (!emailValue) {
      setExpiresInMs(null);
      setChallenge(null);
      setOtpEmail(null);
      setOtpVerified(false);
      setVerifiedEmail(null);
      setCooldownMs(0);
      return;
    }
    if (emailValue !== otpEmail) {
      setExpiresInMs(null);
      setChallenge(null);
      setOtpVerified(false);
      setVerifiedEmail(null);
      setCooldownMs(0);
      return;
    }
  }, [emailValue]);

  const onEmailSubmit: SubmitHandler<ForgotPasswordFormData> = async (data) => {
    setError("");
    await sendOtp(data.email);
  };

  const onOtpVerify = () => {
    setOtpVerified(true);
    setVerifiedEmail(otpEmail ?? emailValue);
    setCurrentStep("password");
  };

  const onPasswordSubmit: SubmitHandler<ForgotPasswordFormData> = async (data) => {
    if (!otpVerified || !verifiedEmail) {
      setError("Please verify your OTP first.");
      return;
    }
    if (data.newPassword !== data.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await apiClient.post("/users/forgot-password", {
        email: verifiedEmail,
        newPassword: data.newPassword,
        challenge: challenge,
      });

      setSuccess("Password reset successfully! You can now login with your new password.");
      setCurrentStep("success");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setCurrentStep("email");
    setOtpVerified(false);
    setVerifiedEmail(null);
    setExpiresInMs(null);
    setChallenge(null);
    setOtpEmail(null);
    setError("");
    setSuccess("");
  };

  const handleBackToOtp = () => {
    setCurrentStep("otp");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <main className="w-full max-w-md sm:max-w-lg md:max-w-xl flex items-center justify-center">
        <div className="w-full bg-neutral-900/70 backdrop-blur-md border border-emerald-800/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-2">
            <Image src="/logo.png" alt="Logo" width={110} height={110} />
          </div>

          <h2 className="text-center text-2xl font-bold text-white mb-1">
            {currentStep === "email" && "Reset Password"}
            {currentStep === "otp" && "Verify OTP"}
            {currentStep === "password" && "Set New Password"}
            {currentStep === "success" && "Password Reset Successful"}
          </h2>
          
          <p className="text-center text-sm text-neutral-300 mb-6">
            {currentStep === "email" && "Enter your email address to receive a verification code."}
            {currentStep === "otp" && "Enter the 6-digit code sent to your email."}
            {currentStep === "password" && "Enter your new password."}
            {currentStep === "success" && "Your password has been reset successfully."}
          </p>

          {error && (
            <div className="mb-4 rounded-md px-4 py-3 bg-red-900/40 text-rose-300 border border-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md px-4 py-3 bg-emerald-900/40 text-emerald-300 border border-emerald-700">
              {success}
            </div>
          )}

          {/* Step 1: Email Input */}
          {currentStep === "email" && (
            <form className="space-y-5" onSubmit={handleSubmit(onEmailSubmit)}>
              <div>
                <input
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  onChange={(e) => setEmailValue(e.target.value)}
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-600 rounded-md 
                             bg-gray-700 text-white 
                             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
                {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || isSendingOtp}
                className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSendingOtp ? "Sending..." : "Send Reset Code"}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-emerald-300 hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === "otp" && (
            <div className="space-y-5">
              <div className="text-center text-sm text-neutral-300">
                We sent a verification code to <strong>{emailValue}</strong>
              </div>

              {expiresInMs && !otpVerified && (
                <OtpInput
                  email={otpEmail ?? emailValue}
                  challenge={challenge ?? ""}
                  expiresInMs={expiresInMs}
                  onVerify={onOtpVerify}
                  onError={setError}
                />
              )}

              <button
                type="button"
                onClick={() => sendOtp(emailValue)}
                disabled={cooldownMs > 0 || isSendingOtp}
                className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSendingOtp ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : cooldownMs > 0 ? (
                  `Wait ${Math.ceil(cooldownMs / 1000)}s`
                ) : (
                  "Resend Code"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-emerald-300 hover:underline"
                >
                  Change Email Address
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {currentStep === "password" && (
            <form className="space-y-5" onSubmit={handleSubmit(onPasswordSubmit)}>
              <div>
                <label htmlFor="newPassword" className="sr-only">New Password</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    {...register("newPassword", { 
                      required: "New password is required", 
                      minLength: { value: 6, message: "Minimum 6 characters" } 
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    className="w-full px-3 py-2 pr-12 border border-gray-600 rounded-md 
                               bg-gray-700 text-white 
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-400 text-sm mt-2">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    {...register("confirmPassword", { 
                      required: "Please confirm your password",
                      validate: (value) => value === newPassword || "Passwords do not match"
                    })}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    className="w-full px-3 py-2 pr-12 border border-gray-600 rounded-md 
                               bg-gray-700 text-white 
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-2">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToOtp}
                  className="text-emerald-300 hover:underline"
                >
                  Back to OTP Verification
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {currentStep === "success" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Password Reset Complete!</h3>
                <p className="text-sm text-neutral-300 mb-4">
                  Your password has been successfully reset. You can now login with your new password.
                </p>
              </div>

              <Link
                href="/login"
                className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 text-center block"
              >
                Continue to Login
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
