import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../validators/validate.js";
import {
  toggleCommentLikeValidator,
  toggleVideoLikeValidator,
  toggleTweetLikeValidator,
} from "../validators/like.validator.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/toggle/v/:videoId")
  .post(toggleVideoLikeValidator(), validate, toggleVideoLike);
router
  .route("/toggle/c/:commentId")
  .post(toggleCommentLikeValidator(), validate, toggleCommentLike);
router
  .route("/toggle/t/:tweetId")
  .post(toggleTweetLikeValidator(), validate, toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router;
