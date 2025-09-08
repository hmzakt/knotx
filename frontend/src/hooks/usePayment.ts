"use client";
import { useState, useCallback } from 'react';
import apiClient from '../lib/api';

interface PaymentOrder {
  keyId: string;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  };
}

interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface PaymentData {
  type: 'single-paper' | 'test-series' | 'all-access';
  itemId?: string;
  baseAmount: number;
  currency?: string;
  promoCode?: string;
  durationDays?: number;
}

interface UsePaymentReturn {
  isProcessing: boolean;
  error: string | null;
  createOrder: (data: PaymentData) => Promise<PaymentOrder | null>;
  verifyPayment: (verification: PaymentVerification) => Promise<boolean>;
  clearError: () => void;
}

export const usePayment = (): UsePaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createOrder = useCallback(async (data: PaymentData): Promise<PaymentOrder | null> => {
    try {
      setIsProcessing(true);
      setError(null);

      // Validate required fields
      if (!data.type) {
        throw new Error('Payment type is required');
      }
      if (data.type !== 'all-access' && !data.itemId) {
        throw new Error('Item ID is required for this payment type');
      }
      if (!data.baseAmount || data.baseAmount < 100) {
        throw new Error('Amount must be at least ₹1 (100 paise)');
      }

      // Convert amount to paise if needed
      const amountInPaise = data.baseAmount < 100 ? data.baseAmount * 100 : data.baseAmount;

      const response = await apiClient.post('/payments/orders', {
        type: data.type,
        itemId: data.itemId,
        baseAmount: amountInPaise,
        currency: data.currency || 'INR',
        promoCode: data.promoCode,
        durationDays: data.durationDays || 30
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create payment order');
      }

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create payment order';
      setError(errorMessage);
      console.error('Payment order creation error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const verifyPayment = useCallback(async (verification: PaymentVerification): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setError(null);

      if (!verification.razorpay_order_id || !verification.razorpay_payment_id || !verification.razorpay_signature) {
        throw new Error('Missing payment verification data');
      }

      const response = await apiClient.post('/payments/verify', verification);

      if (!response?.data?.success) {
        // Surface backend message if present
        const backendMessage = response?.data?.message || 'Payment verification failed';
        throw new Error(backendMessage);
      }

      return true;
    } catch (err: any) {
      // Include status code and backend message to aid debugging (e.g., 500 due to missing Razorpay keys)
      const backendMessage = err?.response?.data?.message;
      const status = err?.response?.status;
      const errorMessage = backendMessage || err.message || 'Payment verification failed';
      setError(status ? `(${status}) ${errorMessage}` : errorMessage);
      console.error('Payment verification error:', {
        status,
        backendMessage,
        error: err
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    error,
    createOrder,
    verifyPayment,
    clearError
  };
};
