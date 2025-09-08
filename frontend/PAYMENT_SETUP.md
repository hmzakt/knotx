# Payment Setup Guide

## Environment Variables Required

Create a `.env.local` file in the frontend directory with the following variables:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Optional: Payment Test Mode
NEXT_PUBLIC_PAYMENT_TEST_MODE=true
```

## Razorpay Setup

### 1. Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account
3. Complete KYC verification

### 2. Get API Keys
1. Go to Settings > API Keys
2. Generate new API keys
3. Copy the Key ID and Key Secret
4. Add them to your environment variables

### 3. Configure Webhooks
1. Go to Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/v1/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Save the webhook

## Testing

### 1. Test Cards
Use these test cards for testing:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits
- Name: Any name

**Failed Payment:**
- Card Number: `4000 0000 0000 0002`
- Expiry: Any future date
- CVV: Any 3 digits

### 2. Test Promo Codes
Create test promo codes in your admin panel:
- Code: `TEST20` (20% discount)
- Code: `SAVE50` (50% discount)

## Security Checklist

### 1. Production Setup
- [ ] Use production Razorpay keys
- [ ] Enable HTTPS for all endpoints
- [ ] Configure proper CORS settings
- [ ] Set up webhook signature verification
- [ ] Enable rate limiting

### 2. Database Setup
- [ ] Ensure subscription model is properly indexed
- [ ] Set up proper user-subscription relationships
- [ ] Configure subscription expiry job

### 3. Monitoring
- [ ] Set up payment success/failure monitoring
- [ ] Configure error alerting
- [ ] Monitor subscription creation rates

## Troubleshooting

### Common Issues

1. **Payment Modal Not Opening**
   - Check if Razorpay script is loaded
   - Verify API keys are correct
   - Check browser console for errors

2. **Payment Verification Failing**
   - Verify webhook is configured correctly
   - Check server logs for signature verification errors
   - Ensure webhook URL is accessible

3. **Subscription Not Created**
   - Check database connection
   - Verify user authentication
   - Check subscription model validation

### Debug Steps

1. **Check Browser Console**
   ```javascript
   // Check if Razorpay is loaded
   console.log(window.Razorpay);
   
   // Check API response
   console.log(response);
   ```

2. **Check Network Tab**
   - Verify API calls are being made
   - Check response status codes
   - Look for CORS errors

3. **Check Server Logs**
   - Look for payment verification errors
   - Check subscription creation logs
   - Verify webhook processing

## Support

For issues with payment integration:
1. Check this documentation first
2. Review Razorpay documentation
3. Check server logs for errors
4. Contact development team

## Updates

Keep the payment integration updated:
- Monitor Razorpay API changes
- Update SDK versions regularly
- Test after any backend changes
- Review security best practices
