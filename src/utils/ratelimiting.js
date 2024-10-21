import rateLimit from "express-rate-limit";
import { ApiError } from "./ApiError.js";

export const videoUploadRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 5, // 5 upload in a day
  handler: (req, res, next, option) => {
    throw new ApiError(
      option.statusCode || 500,
      `You have reached the upload limit of ${option.limit} videos per day.`
    );
  },
});
