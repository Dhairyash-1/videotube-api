import { body } from "express-validator";
import { allowedImageTypes, MAX_IMAGE_SIZE } from "../constants.js";

const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid Email"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be lowercase")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long")
      .matches(/^[a-z0-9]+$/)
      .withMessage("Username can only contain lowercase letters and numbers"),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),

    body("fullName")
      .trim()
      .notEmpty()
      .withMessage("Full name is required")
      .isLength({ min: 1, max: 50 })
      .withMessage("Full name must be between 1 and 50 characters long")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Full name can only contain letters and spaces"),
    body("avatar").custom((value, { req }) => {
      if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
        throw new Error("Avatar file is missing");
      }
      const avatarFile = req.files.avatar[0];
      if (!allowedImageTypes.includes(avatarFile.mimetype)) {
        throw new Error(
          "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed."
        );
      }
      if (avatarFile.size > MAX_IMAGE_SIZE) {
        // 1 MB limit
        throw new Error("Maximum file size of avatar must be 1MB");
      }

      if (!req.files.coverImage || req.files.coverImage.length === 0) {
        throw new Error("CoverImage file is missing");
      }

      const coverImageFile = req.files.coverImage[0];

      if (!allowedImageTypes.includes(coverImageFile.mimetype)) {
        throw new Error(
          "Invalid CoverImage format. Only JPG, PNG, GIF, and WEBP are allowed."
        );
      }
      if (coverImageFile.size > MAX_IMAGE_SIZE) {
        throw new Error("CoverImage file size must not exceed 1MB.");
      }

      return true;
    }),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").trim().optional().isEmail().withMessage("Invaild Email"),
    body("username").trim().optional(),
    body("password").trim().notEmpty().withMessage("Password is required"),

    body().custom((value) => {
      if (!value.email && !value.username) {
        throw new Error("Either Username or Email must be provided");
      }
      return true;
    }),
  ];
};

const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword")
      .notEmpty()
      .withMessage("Old Password is required")
      .isLength({ min: 6 })
      .withMessage("Old Password must be at least 6 characters long"),
    body("newPassword")
      .notEmpty()
      .withMessage("New Password is required")
      .isLength({ min: 6 })
      .withMessage("New Password must be at least 6 characters long"),
  ];
};

const userUpdateAccountDetailsValidator = () => {
  return [
    body("email").optional().isEmail().withMessage("Email is invalid"),

    body("fullName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage("Full name must be between 1 and 50 characters long")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Full name can only contain letters and spaces"),

    // Custom validation to ensure at least one field is provided
    body().custom((value) => {
      if (!value.email && !value.fullName) {
        throw new Error("Either Full Name or Email is required");
      }
      return true;
    }),
  ];
};

const updateUserAvatarValidator = () => {
  return [
    body("avatar").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Avatar file is missing");
      }

      if (!allowedImageTypes.includes(req.file.mimetype)) {
        throw new Error(
          "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed."
        );
      }
      if (req.file.size > MAX_IMAGE_SIZE) {
        // 1 MB limit
        throw new Error("Maximum file size of avatar must be 1MB");
      }
      return true;
    }),
  ];
};
const updateUserCoverImageValidator = () => {
  return [
    body("coverImage").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Cover Image file is missing");
      }

      if (!allowedImageTypes.includes(req.file.mimetype)) {
        throw new Error(
          "Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed."
        );
      }
      if (req.file.size > MAX_IMAGE_SIZE) {
        // 1 MB limit
        throw new Error("Maximum file size of coverImage must be 1MB");
      }
      return true;
    }),
  ];
};

export {
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userUpdateAccountDetailsValidator,
  updateUserAvatarValidator,
  updateUserCoverImageValidator,
};
