"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm, SubmitHandler } from "react-hook-form";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import apiClient from "../../lib/api";

interface LoginFormData {
  email: string;
  password: string;
}

interface ErrorResponse {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
}

interface ErrorInfo {
  message: string;
  type: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const { login } = useAuth();

  const getErrorMessage = (error: ErrorResponse): ErrorInfo => {
    if (!error.response) {
      return {
        message:
          "Network error. Please check your internet connection and try again.",
        type: "network",
      };
    }

    const statusCode = error.response.status;
    const backendMessage = error.response.data?.message;

    switch (statusCode) {
      case 400:
        return {
          message: backendMessage || "Please provide both email and password.",
          type: "validation",
        };
      case 401:
        return {
          message:
            "Invalid email or password. Please check your credentials and try again.",
          type: "auth",
        };
      case 404:
        return {
          message:
            "No account found with this email. Please check your email or sign up for a new account.",
          type: "notfound",
        };
      case 409:
        return {
          message: "Account already exists. Please try logging in instead.",
          type: "conflict",
        };
      case 429:
        return {
          message: "Too many login attempts. Please wait a few minutes.",
          type: "rateLimit",
        };
      case 500:
        return {
          message:
            "Server error. Please try again later or contact support if the problem persists.",
          type: "server",
        };
      default:
        return {
          message: backendMessage || "An unexpected error occurred. Please try again.",
          type: "unknown",
        };
    }
  };

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsLoading(true);
    setError("");
    setErrorType("");

    try {
      const response = await apiClient.post("/users/login", data);
      const { user, accessToken } = response.data.data;
      login(user, accessToken);
      // keep previous behavior
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const errorInfo = getErrorMessage(err as ErrorResponse);
      setError(errorInfo.message);
      setErrorType(errorInfo.type);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left hero / branding */}
        <aside className="lg:col-span-5 hidden lg:flex flex-col justify-center rounded-2xl p-8 bg-gradient-to-b from-emerald-900/60 to-neutral-900/60 ring-1 ring-emerald-800/30 shadow-xl overflow-hidden">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-emerald-300">
                Welcome back
              </h1>
              <p className="text-sm text-emerald-200/80">
                Sign in to access your dashboard and analytics.
              </p>
            </div>
          </div>

          <div className="mt-8 text-emerald-100/80 space-y-4">
            <p className="leading-relaxed">
              Built for students — keep track of attempts, get expert-prepared
              papers and personalized guidance. Fast, secure and privacy-focused.
            </p>

            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <span>Structured test-series &amp; expert papers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <span>Personalized mentorship &amp; analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <span>Secure authentication and fast sync</span>
              </li>
            </ul>
          </div>

          <div className="mt-auto text-sm text-emerald-200/50">
            <p>Need help? Contact support at mail2Knotx@gmail.com</p>
          </div>
        </aside>

        {/* Form card */}
        <main className="lg:col-span-7 flex items-center justify-center">
          <div className="w-full max-w-md bg-neutral-900/70 backdrop-blur-md border border-emerald-800/30 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <Image src="/logo.png" alt="Logo" width={90} height={90} />
            </div>
            <h2 className="text-center text-2xl font-bold text-white mb-4">
              Sign in to your account
            </h2>

            {/* Error alert */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className={cn(
                  "mb-4 rounded-md px-4 py-3 flex gap-3 items-start",
                  // color by errorType
                  errorType === "network"
                    ? "bg-yellow-900/40 text-yellow-300 border border-yellow-700"
                    : errorType === "validation"
                    ? "bg-amber-900/40 text-amber-300 border border-amber-700"
                    : "bg-red-900/40 text-rose-300 border border-rose-700"
                )}
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-medium">
                    {errorType === "network"
                      ? "Connection Problem"
                      : errorType === "validation"
                      ? "Validation Error"
                      : errorType === "auth"
                      ? "Authentication Failed"
                      : errorType === "notfound"
                      ? "Account Not Found"
                      : "Error"}
                  </p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Email */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Please enter a valid email address",
                      },
                    })}
                    className={cn(
                      "block w-full rounded-xl py-3 pl-12 pr-3 text-sm placeholder-neutral-400 focus:outline-none transition",
                      errors.email
                        ? "ring-1 ring-rose-600 bg-neutral-900/60 text-white"
                        : "ring-1 ring-emerald-800/30 bg-neutral-900/40 text-white"
                    )}
                    placeholder="Email address"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-2 text-xs text-rose-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "At least 6 characters" },
                    })}
                    className={cn(
                      "block w-full rounded-xl py-3 pl-12 pr-12 text-sm placeholder-neutral-400 focus:outline-none transition",
                      errors.password
                        ? "ring-1 ring-rose-600 bg-neutral-900/60 text-white"
                        : "ring-1 ring-emerald-800/30 bg-neutral-900/40 text-white"
                    )}
                    placeholder="Password"
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
                {errors.password && (
                  <p id="password-error" className="mt-2 text-xs text-rose-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 focus:ring-emerald-500"
                  />
                  Remember me
                </label>

                <Link href="/forgot-password" className="text-sm text-emerald-400 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition shadow-sm",
                    isLoading
                      ? "bg-emerald-600/80 cursor-wait text-white opacity-80"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  )}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-emerald-300 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
