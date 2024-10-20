import { body, query, param } from "express-validator";
import {
  allowedImageTypes,
  MAX_IMAGE_SIZE,
  allowedVideoTypes,
  maxVideoSize,
} from "../constants.js";

const getAllVideosValidator = () => {
  return [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer")
      .toInt(),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100")
      .toInt(),
    query("query").optional().isString().withMessage("Query must be string"),
    query("sortBy")
      .isIn(["createdAt", "views", "durations"])
      .withMessage(
        "sortBy must be one of the following: createdAt, views, durations"
      ),
    query("sortType")
      .isIn(["asc", "desc"])
      .withMessage("sortType must be either 'asc' or 'desc'"),
    query("userId")
      .exists()
      .withMessage("UserId is required")
      .isMongoId()
      .withMessage("Invaild User Id"),
  ];
};

const publishAVideoValidator = () => {
  return [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Video Title is required")
      .isLength({ min: 5, max: 100 })
      .withMessage("Video Title must be between 5 and 100 characters long."),

    body("description")
      .trim()
      .notEmpty()
      .withMessage("Video description is required")
      .isLength({ min: 10, max: 500 })
      .withMessage(
        "Video description must be between 10 and 500 characters long."
      ),

    body().custom((value, { req }) => {
      // Check for video file
      if (
        !req.files ||
        !req.files.videoFile ||
        req.files.videoFile.length === 0
      ) {
        throw new Error("Video file is missing");
      }

      // Validate video file size and format
      const videoFile = req.files.videoFile[0];

      if (!allowedVideoTypes.includes(videoFile.mimetype)) {
        throw new Error(
          "Invalid video format. Only MP4, AVI, and MKV are allowed."
        );
      }

      if (videoFile.size > maxVideoSize) {
        throw new Error("Video file size must not exceed 50MB.");
      }

      // Check for thumbnail file
      if (!req.files.thumbnail || req.files.thumbnail.length === 0) {
        throw new Error("Thumbnail file is missing");
      }

      const thumbnailFile = req.files.thumbnail[0];

      if (!allowedImageTypes.includes(thumbnailFile.mimetype)) {
        throw new Error(
          "Invalid thumbnail format. Only JPG, PNG, GIF, and WEBP are allowed."
        );
      }
      if (thumbnailFile.size > MAX_IMAGE_SIZE) {
        throw new Error("thumbnail file size must not exceed 1MB.");
      }

      return true;
    }),
  ];
};

const getVideoByIdValidator = () => {
  return [
    param("videoId")
      .trim()
      .notEmpty()
      .withMessage("Video ID is required")
      .isMongoId()
      .withMessage("Invaild Video ID"),
  ];
};
const deleteVideoValidator = () => {
  return [
    param("videoId")
      .trim()
      .notEmpty()
      .withMessage("Video ID is required")
      .isMongoId()
      .withMessage("Invaild Video ID"),
  ];
};
const toggleVideoPublishStatusValidator = () => {
  return [
    param("videoId")
      .trim()
      .notEmpty()
      .withMessage("Video ID is required")
      .isMongoId()
      .withMessage("Invaild Video ID"),
  ];
};

const updateVideoValidator = () => {
  return [
    param("videoId")
      .trim()
      .notEmpty()
      .withMessage("Video ID required")
      .isMongoId()
      .withMessage("Invaild Video ID"),
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required to update video")
      .isLength({ min: 5, max: 100 })
      .withMessage("Video Title must be between 5 and 100 characters long."),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required to update video")
      .isLength({ min: 10, max: 500 })
      .withMessage("Video Title must be between 10 and 500 characters long."),
    body("thumbnail").custom((value, { req }) => {
      // Check for thumbnail file
      if (!req.file) {
        throw new Error("Thumbnail file is missing");
      }

      if (!allowedImageTypes.includes(req.file.mimetype)) {
        throw new Error(
          "Invalid thumbnail format. Only JPG, PNG, GIF, and WEBP are allowed."
        );
      }
      if (req.file.size > MAX_IMAGE_SIZE) {
        throw new Error("thumbnail file size must not exceed 1MB.");
      }
      return true;
    }),
  ];
};
export {
  getAllVideosValidator,
  publishAVideoValidator,
  getVideoByIdValidator,
  deleteVideoValidator,
  toggleVideoPublishStatusValidator,
  updateVideoValidator,
};
