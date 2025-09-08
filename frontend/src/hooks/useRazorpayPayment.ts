"use client";
import { useState, useCallback, useEffect } from 'react';
import { usePayment } from './usePayment';
import { useUserSubscriptions } from './useUserSubscriptions';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

interface PaymentData {
  type: 'single-paper' | 'test-series' | 'all-access';
  itemId?: string;
  baseAmount: number;
  currency?: string;
  promoCode?: string;
  durationDays?: number;
  itemName?: string;
  itemDescription?: string;
}

interface UseRazorpayPaymentReturn {
  isProcessing: boolean;
  error: string | null;
  initiatePayment: (data: PaymentData) => Promise<boolean>;
  clearError: () => void;
}

export const useRazorpayPayment = (): UseRazorpayPaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  const { createOrder, verifyPayment, error: paymentError, isProcessing: paymentProcessing } = usePayment();
  const { refetch: refetchSubscriptions } = useUserSubscriptions();

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          setError('Failed to load Razorpay payment gateway');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpay();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const initiatePayment = useCallback(async (data: PaymentData): Promise<boolean> => {
    if (!razorpayLoaded) {
      setError('Payment gateway is still loading. Please try again.');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create payment order
      const orderData = await createOrder(data);
      if (!orderData) {
        return false;
      }

      // Prepare Razorpay options
      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'KnotX',
        description: data.itemDescription || `Payment for ${data.type}`,
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            // Verify payment (primary path)
            const isVerified = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (!isVerified) {
              // Fallback: occasionally webhooks complete subscription even if /verify fails
              await refetchSubscriptions();
              alert('Payment processed. If your subscription is not visible, it may take a moment.');
              window.location.href = '/subscriptions';
              return;
            }

            // Success flow
            await refetchSubscriptions();
            alert('Payment successful! Your subscription is now active.');
            window.location.href = '/subscriptions';
          } catch (err) {
            console.error('Payment verification error:', err);
            // Best-effort refresh to check if webhook already provisioned the subscription
            await refetchSubscriptions();
            alert('There was an issue verifying the payment. If you were charged, your subscription may appear shortly.');
          }
        },
        prefill: {
          name: data.itemName || 'User',
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initiate payment';
      setError(errorMessage);
      console.error('Payment initiation error:', err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [razorpayLoaded, createOrder, verifyPayment, refetchSubscriptions]);

  return {
    isProcessing: isProcessing || paymentProcessing,
    error: error || paymentError,
    initiatePayment,
    clearError
  };
};
