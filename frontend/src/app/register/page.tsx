"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import Link from "next/link";
import OtpInput from "../../components/otpInput";
import apiClient from "../../lib/api";
import { Eye, EyeOff } from "lucide-react";

interface RegisterFormData {
  fullname: string;
  email: string;
  username: string;
  password: string;
}

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [cooldownMs, setCooldownMs] = useState<number>(0);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState<string | null>(null); // email tied to current OTP
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null); // email that was OTP-verified
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const id = setInterval(() => setCooldownMs((ms) => (ms - 1000 <= 0 ? 0 : ms - 1000)), 1000);
    return () => clearInterval(id);
  }, [cooldownMs]);

  const sendOtp = async (email: string) => {
    if (!email) return;
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // bind OTP session to this email and reset previous verification state
        setOtpEmail(email);
        setOtpVerified(false);
        setVerifiedEmail(null);
        setExpiresInMs(data.expiresInMs ?? 60000);
        // start cooldown based on server response if provided
        if (typeof data.retryAfterMs === "number") setCooldownMs(data.retryAfterMs);
        if (typeof data.challenge === "string") setChallenge(data.challenge);
        setError("");
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

  // When email changes: reset OTP UI; do NOT auto-send (send only on button click)
  useEffect(() => {
    // Empty email: clear OTP state
    if (!emailValue) {
      setExpiresInMs(null);
      setChallenge(null);
      setOtpEmail(null);
      setOtpVerified(false);
      setVerifiedEmail(null);
      setCooldownMs(0);
      return;
    }
    // Different email than current OTP email: reset local OTP state (no auto-send)
    if (emailValue !== otpEmail) {
      // Reset local OTP state immediately
      setExpiresInMs(null);
      setChallenge(null);
      setOtpVerified(false);
      setVerifiedEmail(null);
      setCooldownMs(0);
      return;
    }
  }, [emailValue]);

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    if (!otpVerified) {
      setError("Please verify your OTP before registering.");
      return;
    }
    if (!verifiedEmail || data.email !== verifiedEmail) {
      setError("Email changed after verification. Please verify OTP for the current email.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("fullname", data.fullname);
      formData.append("email", data.email);
      formData.append("username", data.username);
      formData.append("password", data.password);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await apiClient.post("/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      window.location.href = "/login?message=Registration successful. Please login.";
    } catch (err) {
      setError("Failed to create an account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Form card only (removed aside/hero) */}
      <main className="w-full max-w-md sm:max-w-lg md:max-w-xl flex items-center justify-center">
        <div className="w-full bg-neutral-900/70 backdrop-blur-md border border-emerald-800/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-2">
              <Image src="/logo.png" alt="Logo" width={110} height={110} />
            </div>

            <h2 className="text-center text-2xl font-bold text-white mb-1">Create a new account</h2>
            <p className="text-center text-sm text-neutral-300 mb-6">It only takes a minute.</p>

            {error && (
              <div className="mb-4 rounded-md px-4 py-3 bg-red-900/40 text-rose-300 border border-rose-700">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Profile Picture (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-200
                file:mr-4 file:py-2 file:px-4 file:rounded-md 
                file:border-0 file:text-sm file:font-semibold 
                file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
            />
          </div>

          {/* Full Name */}
          <div>
            <input
              {...register("fullname", { required: "Full name is required" })}
              type="text"
              placeholder="Full Name"
              className="w-full px-3 py-2 border border-gray-600 rounded-md 
                         bg-gray-700 text-white 
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            {errors.fullname && <p className="text-red-400 text-sm">{errors.fullname.message}</p>}
          </div>

          {/* Email with OTP */}
          <div>
            <div className="flex space-x-2">
              <input
                {...register("email", { required: "Email is required" })}
                onChange={(e) => setEmailValue(e.target.value)}
                type="email"
                placeholder="Email address"
                className="flex-1 px-3 py-2 border border-gray-600 rounded-md 
                           bg-gray-700 text-white 
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => sendOtp(emailValue)}
                disabled={cooldownMs > 0 || isSendingOtp}
                className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
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
                ) : expiresInMs && !otpVerified ? (
                  "Resend OTP"
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>
            {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
          </div>

          {/* OTP Input */}
          {expiresInMs && !otpVerified && (
            <OtpInput
              email={otpEmail ?? emailValue}
              challenge={challenge ?? ""}
              expiresInMs={expiresInMs}
              onVerify={() => {
                setOtpVerified(true);
                setVerifiedEmail(otpEmail ?? emailValue);
              }}
            />
          )}

          {/* Username */}
          <div>
            <input
              {...register("username", { required: "Username is required" })}
              type="text"
              placeholder="Username"
              className="w-full px-3 py-2 border border-gray-600 rounded-md 
                         bg-gray-700 text-white 
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            {errors.username && <p className="text-red-400 text-sm">{errors.username.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <input
                id="password"
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 chars" } })}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full px-3 py-2 pr-12 border border-gray-600 rounded-md 
                           bg-gray-700 text-white 
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
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
            {errors.password && <p id="password-error" className="text-red-400 text-sm mt-2">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? "Creating Account..." : "Sign up"}
          </button>

              <div className="text-center">
                <Link href="/login" className="text-emerald-300 hover:underline">
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
  );
}
