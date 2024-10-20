import { param } from "express-validator";

const toggleVideoLikeValidator = () => {
  return [
    param("videoId")
      .trim()
      .notEmpty()
      .withMessage("VideoId is required")
      .isMongoId()
      .withMessage("VideoId is Invaild"),
  ];
};
const toggleCommentLikeValidator = () => {
  return [
    param("commentId")
      .trim()
      .notEmpty()
      .withMessage("commentId is required")
      .isMongoId()
      .withMessage("commentId is Invaild"),
  ];
};
const toggleTweetLikeValidator = () => {
  return [
    param("tweetId")
      .trim()
      .notEmpty()
      .withMessage("tweetId is required")
      .isMongoId()
      .withMessage("tweetId is Invaild"),
  ];
};

export {
  toggleTweetLikeValidator,
  toggleCommentLikeValidator,
  toggleVideoLikeValidator,
};
