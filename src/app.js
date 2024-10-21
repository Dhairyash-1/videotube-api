import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import requestIp from "request-ip";
import morganMiddleware from "./logger/morgan.logger.js";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(requestIp.mw());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true, // show the rate limit info to client
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.clientIp;
  },
  handler: (_, __, ___, option) => {
    throw new ApiError(
      option.statusCode || 500,
      `There are too many requests. You are only allowed to ${option.limit} requests per ${option.windowMs / 60000} minutes`
    );
  },
});

// apply rate limiting to all requests
app.use(limiter);

app.use(express.json({ limit: "16kb" })); // to read json from body
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // to access url values
app.use(express.static("public"));
app.use(cookieParser());

app.use(morganMiddleware);

// middlewars import
import errorHandler from "./middlewares/error.middleware.js";

// Routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

// Routes declaration
app.use("/api/v1/healthCheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// http://localhost:8000/api/v1/users/register

// middleware for application error handling
app.use(errorHandler);

export default app;
