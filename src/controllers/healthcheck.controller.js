import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// HEALTH CHECK CONTROLLER
const healthcheck = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, {}, "Health is Ok"));
});

export { healthcheck };
