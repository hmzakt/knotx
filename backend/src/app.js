import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { startSubscriptionExpiryJob } from "./scheduler/subscriptionExpiry.js";
import helmet from "helmet"
import compression from "compression"



const app = express()

// Behind Render/Proxies, trust the first proxy for correct protocol/headers
app.set('trust proxy', 1);

// app.use(cors())
app.use(helmet());

// Allow multiple origins via comma-separated CORS_ORIGIN; default to localhost for dev
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow same-origin requests or non-browser requests with no Origin header
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(compression());


app.use(express.json({
    limit: "20kb"
}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'
import adminRouter from './routes/admin.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import publicContentRouter from './routes/public.content.routes.js'
import protectedContentRouter from './routes/private.content.routes.js'
import { authLimiter, adminLimiter } from './security/ratelimiting.js'
import attemptsRouter from "./routes/attempts.route.js"

//route security
app.use("/api/v1/users", authLimiter);
// app.use("/api/v1/admin", adminLimiter);


//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/public", publicContentRouter);
app.use("/api/v1/private",protectedContentRouter);


app.use("/api/v1/attempts", attemptsRouter);

//runs to clean database every midnight for expired subscription
startSubscriptionExpiryJob();


import promoRouter from "./routes/promocode.routes.js";
import paymentRouter from "./routes/payment.routes.js";

app.use("/api/v1/promos", promoRouter);
app.use("/api/v1/payments", paymentRouter);


export {app};