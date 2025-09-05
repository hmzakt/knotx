"use client";   // 👈 Add this at the very top

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../lib/api";

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // Track error type for better styling
  const { login } = useAuth();

  const getErrorMessage = (error) => {
    // Handle network errors
    if (!error.response) {
      return {
        message: "Network error. Please check your internet connection and try again.",
        type: "network"
      };
    }

    const statusCode = error.response.status;
    const backendMessage = error.response.data?.message;

    // Map backend error messages to user-friendly messages
    switch (statusCode) {
      case 400:
        return {
          message: backendMessage || "Please provide both email and password.",
          type: "validation"
        };
      case 401:
        return {
          message: "Invalid email or password. Please check your credentials and try again.",
          type: "auth"
        };
      case 404:
        return {
          message: "No account found with this email. Please check your email or sign up for a new account.",
          type: "notfound"
        };
      case 409:
        return {
          message: "Account already exists. Please try logging in instead.",
          type: "conflict"
        };
      case 429:
        return {
          message: "Too many login attempts. Please wait a few minutes before trying again.",
          type: "rateLimit"
        };
      case 500:
        return {
          message: "Server error. Please try again later or contact support if the problem persists.",
          type: "server"
        };
      default:
        return {
          message: backendMessage || "An unexpected error occurred. Please try again.",
          type: "unknown"
        };
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");
    setErrorType("");

    try {
      console.log("With data:", data);
      const response = await apiClient.post("/users/login", data);
      console.log("Response received:", response.data);
      const { user, accessToken } = response.data.data;
      login(user, accessToken);
      window.location.href = "/dashboard";
    } catch (error) {
      console.log("Login error:", error);
      console.log("Error data:", error.response?.data);
      const errorInfo = getErrorMessage(error);
      setError(errorInfo.message);
      setErrorType(errorInfo.type);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div
              className={`px-4 py-3 rounded relative ${
                errorType === "network" 
                  ? "bg-yellow-100 border border-yellow-400 text-yellow-700"
                  : errorType === "server"
                  ? "bg-red-100 border border-red-400 text-red-700"
                  : errorType === "auth" || errorType === "notfound"
                  ? "bg-red-100 border border-red-400 text-red-700"
                  : errorType === "validation"
                  ? "bg-orange-100 border border-orange-400 text-orange-700"
                  : errorType === "rateLimit"
                  ? "bg-purple-100 border border-purple-400 text-purple-700"
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}
              role="alert"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {errorType === "network" && (
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {errorType === "auth" && (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {errorType === "server" && (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {errorType === "validation" && (
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {!["network", "auth", "server", "validation"].includes(errorType) && (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {errorType === "network" && "Connection Error"}
                    {errorType === "auth" && "Authentication Failed"}
                    {errorType === "server" && "Server Error"}
                    {errorType === "validation" && "Validation Error"}
                    {errorType === "notfound" && "Account Not Found"}
                    {errorType === "rateLimit" && "Too Many Attempts"}
                    {!["network", "auth", "server", "validation", "notfound", "rateLimit"].includes(errorType) && "Error"}
                  </h3>
                  <div className="mt-2 text-sm">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address",
                  },
                })}
                type="email"
                autoComplete="email"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:z-10 sm:text-sm ${
                  errors.email 
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register("password", { 
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters long"
                  }
                })}
                type="password"
                autoComplete="current-password"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:z-10 sm:text-sm ${
                  errors.password 
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
