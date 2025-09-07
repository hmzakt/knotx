"use client";
import { useEffect, useState } from 'react';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
  handler: (response: any) => void;
  theme?: {
    color: string;
  };
}

interface UseRazorpayReturn {
  Razorpay: any;
  loading: boolean;
  error: string | null;
}

export const useRazorpay = (): UseRazorpayReturn => {
  const [Razorpay, setRazorpay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve, reject) => {
        // Check if Razorpay is already loaded
        if (window.Razorpay) {
          resolve(window.Razorpay);
          return;
        }

        // Check if script is already being loaded
        if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
          // Wait for the script to load
          const checkLoaded = () => {
            if (window.Razorpay) {
              resolve(window.Razorpay);
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
          return;
        }

        // Create and load the script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          if (window.Razorpay) {
            resolve(window.Razorpay);
          } else {
            reject(new Error('Razorpay failed to load'));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Razorpay script'));
        };

        document.head.appendChild(script);
      });
    };

    loadRazorpay()
      .then((razorpay) => {
        setRazorpay(razorpay);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { Razorpay, loading, error };
};

// Helper function to open Razorpay checkout
export const openRazorpayCheckout = (options: RazorpayOptions, Razorpay: any) => {
  if (!Razorpay) {
    throw new Error('Razorpay not loaded');
  }

  const razorpayOptions = {
    ...options,
    theme: {
      color: '#3B82F6', // Blue theme
    },
  };

  const razorpay = new Razorpay(razorpayOptions);
  razorpay.open();
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}
