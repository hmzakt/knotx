"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useRazorpayPayment } from '@/hooks/useRazorpayPayment';
import { X, CreditCard, Shield, Clock } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
  paymentData: {
    type: 'single-paper' | 'test-series' | 'all-access';
    itemId?: string;
    itemName: string;
    itemDescription: string;
    baseAmount: number;
    currency?: string;
    promoCode?: string;
    durationDays?: number;
  };
}

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess, paymentData }: PaymentModalProps) {
  const [promoCode, setPromoCode] = useState(paymentData?.promoCode || '');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  
  const { initiatePayment, isProcessing, error, clearError } = useRazorpayPayment();

  // Reset promo code when paymentData changes
  useEffect(() => {
    if (paymentData) {
      setPromoCode(paymentData.promoCode || '');
      setPromoDiscount(0);
      setPromoError(null);
    }
  }, [paymentData]);

  // Calculate final amount
  const finalAmount = Math.max((paymentData?.baseAmount || 0) - promoDiscount, 100); // Minimum ₹1

  const validatePromoCode = async (code: string) => {
    if (!code.trim()) {
      setPromoDiscount(0);
      setPromoError(null);
      return;
    }

    try {
      setIsValidatingPromo(true);
      setPromoError(null);
      
      const response = await fetch('/api/v1/promos/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code: code.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        const discount = Math.floor(((paymentData?.baseAmount || 0) * data.discountPercent) / 100);
        setPromoDiscount(discount);
        setPromoError(null);
      } else {
        setPromoDiscount(0);
        setPromoError(data.message || 'Invalid promo code');
      }
    } catch (err) {
      setPromoDiscount(0);
      setPromoError('Failed to validate promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handlePromoCodeChange = (value: string) => {
    setPromoCode(value);
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validatePromoCode(value);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const handlePayment = async () => {
    if (!paymentData) return;
    
    const success = await initiatePayment({
      ...paymentData,
      promoCode: promoCode.trim() || undefined
    });
    
    if (success) {
      onPaymentSuccess?.();
      onClose();
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount / 100);
  };

  if (!isOpen || !paymentData) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 text-gray-100 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Item Details */}
          <div className="bg-neutral-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">{paymentData.itemName}</h3>
            <p className="text-sm text-gray-300 mb-3">{paymentData.itemDescription}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Duration</span>
              <span className="font-medium">
                {paymentData.durationDays || 30} days
              </span>
            </div>
          </div>

          {/* Promo Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Promo Code (Optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => handlePromoCodeChange(e.target.value)}
                placeholder="Enter promo code"
                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg placeholder:text-gray-400 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
              {isValidatingPromo && (
                <div className="flex items-center px-3">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            {promoError && (
              <p className="text-sm text-red-400">{promoError}</p>
            )}
            {promoDiscount > 0 && (
              <p className="text-sm text-emerald-400">
                Discount applied: {formatPrice(promoDiscount)}
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Base Price</span>
              <span className="text-gray-100">{formatPrice(paymentData.baseAmount)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>-{formatPrice(promoDiscount)}</span>
              </div>
            )}
            <div className="border-t border-neutral-800 pt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-emerald-950/40 border border-emerald-900 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div className="text-sm text-emerald-200">
                <p className="font-medium text-emerald-300 mb-1">Secure Payment</p>
                <p>
                  Your payment is processed securely by Razorpay. We never store your payment details.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-950/40 border border-red-900 rounded-lg p-4">
              <p className="text-sm text-red-300">{error}</p>
              <Button
                onClick={clearError}
                variant="outline"
                size="sm"
                className="mt-2 border-neutral-700"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-neutral-700 hover:bg-neutral-800"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Pay {formatPrice(finalAmount)}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
