import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  deleteVideoValidator,
  getAllVideosValidator,
  getVideoByIdValidator,
  publishAVideoValidator,
  toggleVideoPublishStatusValidator,
  updateVideoValidator,
} from "../validators/video.validator.js";
import { validate } from "../validators/validate.js";
import { videoUploadRateLimit } from "../utils/ratelimiting.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
// All routes are protected
router
  .route("/")
  .get(getAllVideosValidator(), validate, getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideoValidator(),
    validate,
    videoUploadRateLimit,
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoByIdValidator(), validate, getVideoById)
  .delete(deleteVideoValidator(), validate, deleteVideo)
  .patch(
    upload.single("thumbnail"),
    updateVideoValidator(),
    validate,
    updateVideo
  );

router
  .route("/toggle/publish/:videoId")
  .patch(toggleVideoPublishStatusValidator(), validate, togglePublishStatus);

export default router;
