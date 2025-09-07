import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       // required
  key_secret: process.env.RAZORPAY_KEY_SECRET // required
});
