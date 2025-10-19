"use client";
import { useEffect, useState } from "react";

interface Props {
  email: string;
  challenge: string;
  expiresInMs?: number; // optional initial expiry from server
  onVerify: () => void;
  onError?: (message: string) => void; // callback for error handling
}

export default function OtpInput({ email, challenge, expiresInMs, onVerify, onError }: Props) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);

  // start countdown when OTP arrives
  useEffect(() => {
    const seconds = Math.floor((expiresInMs ?? 60000) / 1000);
    setTimer(seconds);
    const countdown = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [expiresInMs]);

  const handleVerify = async () => {
    if (timer === 0) {
      onError?.("OTP expired. Request a new one.");
      return;
    }
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, challenge }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onVerify();
      } else {
        onError?.(data.message || "Invalid OTP");
      }
    } catch (err) {
      onError?.("Verification failed. Try again.");
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
        className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
      />
      <button
        type="button"
        onClick={handleVerify}
        className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 focus:outline-none"
      >
        Verify OTP
      </button>
      {timer > 0 ? (
        <p className="text-sm text-neutral-300 text-center">OTP expires in {timer}s</p>
      ) : (
        <p className="text-sm text-red-400 text-center">OTP expired. Request a new one.</p>
      )}
    </div>
  );
}
