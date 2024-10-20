import { body, param } from "express-validator";

const createTweetValidator = () => {
  return [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Content is required")
      .isLength({ min: 10, max: 1000 })
      .withMessage("Content length must be between 10 and 1000 characters"),
  ];
};

const getUserTweetsValidator = () => {
  return [
    param("userId")
      .trim()
      .notEmpty()
      .withMessage("UserId is required")
      .isMongoId()
      .withMessage("UserId is invaild"),
  ];
};

const updateTweetValidator = () => {
  return [
    param("tweetId")
      .trim()
      .notEmpty()
      .withMessage("TweetId is required")
      .isMongoId()
      .withMessage("Tweet Id is invaild"),
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Content is required")
      .isLength({ min: 10, max: 1000 })
      .withMessage("Content length must be between 10 and 1000 characters"),
  ];
};

const deleteTweetValidator = () => {
  return [
    param("tweetId")
      .trim()
      .notEmpty()
      .withMessage("TweetId is required")
      .isMongoId()
      .withMessage("TweetId is invaild"),
  ];
};

export {
  createTweetValidator,
  updateTweetValidator,
  getUserTweetsValidator,
  deleteTweetValidator,
};
