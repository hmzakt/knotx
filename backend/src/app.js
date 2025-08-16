import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { startSubscriptionExpiryJob } from "./scheduler/subscriptionExpiry.js";
import helmet from "helmet"
import compression from "compression"



const app = express()

// app.use(cors())
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*", // Add fallback
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // Explicitly allow methods
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

export {app};