import { query, param, body } from "express-validator";

const getVideoCommentsValidator = () => {
  return [
    param("videoId")
      .trim()
      .notEmpty()
      .withMessage("videoId is required")
      .isMongoId()
      .withMessage("VideoId is Invaild"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be positive integer")
      .toInt(),
    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Limit must be positive integer")
      .toInt(),
  ];
};

const addCommentValidator = () => {
  return [
    param("videoId")
      .trim()
      .notEmpty()
      .withMessage("VideoId is required")
      .isMongoId()
      .withMessage("VideoId is Invaild"),
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Content is required")
      .isLength({ min: 1, max: 500 })
      .withMessage("Content length must be between 1 and 500 characters"),
  ];
};
const updateCommentValidator = () => {
  return [
    param("commentId")
      .trim()
      .notEmpty()
      .withMessage("commentId is required")
      .isMongoId()
      .withMessage("commentId is Invaild"),
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Content is required")
      .isLength({ min: 1, max: 500 })
      .withMessage("Content length must be between 1 and 500 characters"),
  ];
};
const deleteCommentValidator = () => {
  return [
    param("commentId")
      .trim()
      .notEmpty()
      .withMessage("commentId is required")
      .isMongoId()
      .withMessage("commentId is Invaild"),
  ];
};

export {
  addCommentValidator,
  deleteCommentValidator,
  updateCommentValidator,
  getVideoCommentsValidator,
};
