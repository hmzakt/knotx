"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  text: "signin_with" | "signup_with" | "continue_with";
  disabled?: boolean;
  onCredential: (credential: string) => void;
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google script failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed to load"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export default function GoogleAuthButton({ text, disabled = false, onCredential }: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setError("Google sign-in is not configured.");
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
        buttonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) onCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: buttonRef.current.offsetWidth || 320,
          text,
          shape: "rectangular",
        });
      })
      .catch(() => setError("Google sign-in could not be loaded."));

    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential, text]);

  if (error) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700 disabled:opacity-70"
      >
        {error}
      </button>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""} aria-disabled={disabled}>
      <div ref={buttonRef} className="w-full min-h-[44px]" />
    </div>
  );
}
