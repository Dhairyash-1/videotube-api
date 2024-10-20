import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../validators/validate.js";
import {
  updateUserAvatarValidator,
  updateUserCoverImageValidator,
  userChangeCurrentPasswordValidator,
  userLoginValidator,
  userRegisterValidator,
  userUpdateAccountDetailsValidator,
} from "../validators/user.validator.js";

const router = Router();

// unprotected route
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  userRegisterValidator(),
  validate,
  registerUser
);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// protected routes

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);

router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changeCurrentPassword
  );
router
  .route("/update-account")
  .patch(
    verifyJWT,
    userUpdateAccountDetailsValidator(),
    validate,
    updateAccountDetails
  );
router
  .route("/update-avatar")
  .patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatarValidator(),
    validate,
    updateUserAvatar
  );
router
  .route("/update-cover-image")
  .patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImageValidator(),
    validate,
    updateUserCoverImage
  );

export default router;
