import rateLimit from "express-rate-limit";

// Apply to login & signup routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 1000, // 10 requests
  message: { message: "Too many requests, please try again later." }
});

// Apply to admin routes
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: { message: "Too many requests from this IP" }
});


export {authLimiter, adminLimiter}