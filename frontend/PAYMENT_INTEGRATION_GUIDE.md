# Payment Integration Guide

## Overview
This guide covers the complete payment integration using Razorpay for the KnotX application, including security measures, error handling, and state management.

## Architecture

### 1. Payment Flow
```
User clicks "Buy Now" → Payment Modal → Razorpay Checkout → Payment Verification → Subscription Creation
```

### 2. Key Components

#### Hooks
- **`usePayment`**: Core payment logic and API communication
- **`useRazorpayPayment`**: Razorpay UI integration and payment handling

#### Components
- **`PaymentModal`**: User-friendly payment interface with promo code support

## Security Measures

### 1. Client-Side Security
- **Amount Validation**: Ensures minimum payment amount (₹1)
- **Input Sanitization**: All user inputs are validated before processing
- **Error Handling**: Comprehensive error handling prevents data leaks
- **Token Management**: Secure token handling for API requests

### 2. Server-Side Security
- **Signature Verification**: All payments verified using Razorpay signatures
- **Amount Validation**: Server validates payment amounts match order
- **Subscription Validation**: Prevents duplicate subscriptions
- **Promo Code Security**: Server-side promo code validation

### 3. Data Protection
- **No Payment Data Storage**: Payment details never stored on our servers
- **Secure API Communication**: All API calls use HTTPS
- **Token Expiration**: Automatic token refresh handling

## Implementation Details

### 1. Payment Order Creation
```typescript
const orderData = await createOrder({
  type: 'single-paper',
  itemId: 'paper_id',
  baseAmount: 49900, // ₹499 in paise
  currency: 'INR',
  promoCode: 'SAVE20',
  durationDays: 30
});
```

### 2. Razorpay Integration
```typescript
const options = {
  key: orderData.keyId,
  amount: orderData.order.amount,
  currency: 'INR',
  name: 'KnotX',
  description: 'Payment for paper',
  order_id: orderData.order.id,
  handler: async (response) => {
    // Verify payment
    const verified = await verifyPayment(response);
    if (verified) {
      // Update UI and redirect
    }
  }
};
```

### 3. Payment Verification
```typescript
const isVerified = await verifyPayment({
  razorpay_order_id: response.razorpay_order_id,
  razorpay_payment_id: response.razorpay_payment_id,
  razorpay_signature: response.razorpay_signature
});
```

## Error Handling

### 1. Payment Errors
- **Order Creation Failed**: Network or validation errors
- **Payment Cancelled**: User cancels payment
- **Verification Failed**: Signature mismatch or server error
- **Network Errors**: Connection issues

### 2. User Experience
- **Loading States**: Clear loading indicators during processing
- **Error Messages**: User-friendly error messages
- **Retry Options**: Easy retry for failed payments
- **Success Feedback**: Clear confirmation of successful payments

## State Management

### 1. Payment State
```typescript
interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  paymentModal: {
    isOpen: boolean;
    data: PaymentData | null;
  };
}
```

### 2. Subscription Updates
- **Automatic Refresh**: Subscriptions refresh after successful payment
- **UI Updates**: Immediate UI updates to reflect new subscriptions
- **Cache Invalidation**: Proper cache management for data consistency

## Promo Code Integration

### 1. Validation Flow
```typescript
const validatePromoCode = async (code: string) => {
  const response = await apiClient.post('/promos/validate', { code });
  if (response.data.success) {
    const discount = Math.floor((amount * response.data.discountPercent) / 100);
    return discount;
  }
  return 0;
};
```

### 2. Security Features
- **Server-Side Validation**: All promo codes validated on server
- **Usage Limits**: Respects max usage limits
- **Expiration Checks**: Validates promo code expiration
- **User Tracking**: Tracks promo code usage per user

## Testing Considerations

### 1. Test Scenarios
- **Successful Payment**: Complete payment flow
- **Payment Cancellation**: User cancels payment
- **Network Errors**: Simulate network failures
- **Invalid Promo Codes**: Test promo code validation
- **Amount Validation**: Test minimum amount requirements

### 2. Edge Cases
- **Duplicate Subscriptions**: Prevent multiple active subscriptions
- **Expired Promo Codes**: Handle expired codes gracefully
- **Invalid Signatures**: Handle signature verification failures
- **Network Timeouts**: Handle slow network conditions

## Monitoring and Analytics

### 1. Payment Metrics
- **Success Rate**: Track payment success percentage
- **Failure Reasons**: Categorize payment failures
- **Conversion Rate**: Track from click to successful payment
- **Average Order Value**: Monitor payment amounts

### 2. Error Tracking
- **Client Errors**: Track frontend payment errors
- **Server Errors**: Monitor backend payment failures
- **Network Issues**: Track connectivity problems
- **User Behavior**: Monitor payment flow abandonment

## Deployment Checklist

### 1. Environment Variables
```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_API_BASE_URL=your_api_url
```

### 2. Razorpay Configuration
- **Webhook URLs**: Configure webhook endpoints
- **Success URLs**: Set up success redirect URLs
- **Error URLs**: Configure error handling URLs
- **Test Mode**: Ensure proper test/production mode setup

### 3. Security Checklist
- **HTTPS**: Ensure all communication over HTTPS
- **CORS**: Configure proper CORS settings
- **Rate Limiting**: Implement rate limiting for payment endpoints
- **Input Validation**: Validate all inputs on both client and server

## Troubleshooting

### 1. Common Issues
- **Payment Not Processing**: Check Razorpay configuration
- **Verification Failures**: Verify webhook setup
- **Subscription Not Created**: Check database connections
- **UI Not Updating**: Verify state management

### 2. Debug Steps
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check Razorpay dashboard for payment status
4. Review server logs for errors
5. Test with Razorpay test cards

## Future Enhancements

### 1. Planned Features
- **Multiple Payment Methods**: Add more payment options
- **Subscription Management**: Allow users to manage subscriptions
- **Payment History**: Show payment history to users
- **Refund System**: Implement refund functionality

### 2. Security Improvements
- **Fraud Detection**: Implement fraud detection
- **Rate Limiting**: Add more sophisticated rate limiting
- **Audit Logging**: Comprehensive audit logging
- **PCI Compliance**: Ensure PCI compliance

## Support and Maintenance

### 1. Monitoring
- **Payment Success Rate**: Monitor daily
- **Error Rates**: Track and investigate spikes
- **User Feedback**: Collect and address user issues
- **Performance Metrics**: Monitor payment processing times

### 2. Updates
- **Razorpay Updates**: Keep Razorpay SDK updated
- **Security Patches**: Apply security updates promptly
- **Feature Updates**: Regular feature enhancements
- **Bug Fixes**: Quick response to reported issues
