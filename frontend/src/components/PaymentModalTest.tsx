"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import PaymentModal from '@/components/PaymentModal';

// Test component to verify the null safety fix
export default function PaymentModalTest() {
  const [showModal, setShowModal] = useState(false);
  const [testData, setTestData] = useState<any>(null);

  const testWithNullData = () => {
    setTestData(null);
    setShowModal(true);
  };

  const testWithValidData = () => {
    setTestData({
      type: 'single-paper',
      itemId: 'test_id',
      baseAmount: 49900,
      itemName: 'Test Paper',
      itemDescription: 'Test description',
      durationDays: 30
    });
    setShowModal(true);
  };

  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold mb-4">Payment Modal Test</h2>
      
      <div className="space-y-2">
        <Button
          onClick={testWithNullData}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          Test with Null Data (Should not crash)
        </Button>
        
        <Button
          onClick={testWithValidData}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Test with Valid Data
        </Button>
      </div>

      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        paymentData={testData}
      />
    </div>
  );
}
