"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import PaymentModal from '@/components/PaymentModal';

// Test component for payment integration
// This can be used for testing payment functionality
export default function PaymentTest() {
  const [showModal, setShowModal] = useState(false);

  const testPaymentData = {
    type: 'single-paper' as const,
    itemId: 'test_paper_id',
    baseAmount: 49900, // ₹499 in paise
    itemName: 'Test Paper - Mathematics',
    itemDescription: 'Sample paper for testing payment integration',
    durationDays: 30
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Payment Test</h2>
      <p className="text-gray-600 mb-6">
        Click the button below to test the payment integration.
      </p>
      
      <Button
        onClick={() => setShowModal(true)}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Test Payment
      </Button>

      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        paymentData={testPaymentData}
      />
    </div>
  );
}
