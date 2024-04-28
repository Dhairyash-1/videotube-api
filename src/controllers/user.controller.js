import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
  deleteResourceOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// METHOD TO GENERATE ACCESS AND REFRESH TOKEN
const generateAccessandRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false }); //don't use validation before saving

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while genrating access and refresh token"
    );
  }
};

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// REGISTER USER CONTROLLER
const registerUser = asyncHandler(async (req, res) => {
  // 1). Get user details from frontend
  const { username, email, fullName, password } = req.body;

  // 2). validation - not empty
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // 3). check is user already exist or not: username or email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  // 4). check for image and avatar
  // console.log(`multer files:`, req.files);
  const avatarLocalPath = req.files?.avatar[0].path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar File is required");
  const coverImageLocalPath = req.files?.coverImage[0].path;
  // 5). upload them to cloudinary

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "avatar file upload failed");

  // 6). if user not exist then create the user object in db
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    avatar: { url: avatar.url, public_id: avatar.public_id },
    email,
    coverImage: {
      url: coverImage.url || "",
      public_id: coverImage.public_id || "",
    },
    password,
  });

  // 7). remove password and refresh token from response
  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  // 8)  check for user creation
  if (!createdUser)
    throw new ApiError(500, "something went wrong while creating the user");

  // 9). return the response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "user registered successfully"));
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// LOGIN USER CONTROLLER
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(409, "username or email required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User does not exist");
  }

  const isPasswordVaild = await user.isPasswordCorrect(password);

  if (!isPasswordVaild) {
    throw new ApiError(401, "Invaild user credential");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged In successfully"
      )
    );
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// LOGOUT USER CONTROLLER
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }, //this remove field from document
    },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Loggedout Successfully"));
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// REFRESH ACCESS TOKEN CONTROLLER
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invaild refresh token");
    }

    if (user.refreshAccessToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const { accessToken, newRefreshToken } = generateAccessandRefreshToken(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invaild Refresh token");
  }
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// CHANGE CURRENT PASSWORD CONTROLLER
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id); // if user logged in then we can access user object

  const isPasswordVaild = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordVaild) {
    throw new ApiError(401, "Invaild old Password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// GET CURRENT USER CONTROLLER
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// UPDATE ACCOUNT DETAILS CONTROLLER
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, fullName } = req.body;
  if (!(email || fullName)) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user details updated successfully"));
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// UPDATE USER AVATAR CONTROLLER
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "avatar upload on cloudinary failed");
  }
  // delete the previous avatar image from cloud

  await deleteResourceOnCloudinary(req.user?.avatar?.public_id);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: { url: avatar.url, public_id: avatar.public_id },
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// UPDATE USER COVER IMAGE CONTROLLER
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(500, "Cover Image upload on cloudinary failed");
  }
  await deleteResourceOnCloudinary(req.user?.coverImage?.public_id);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: { url: coverImage.url, public_id: coverImage.public_id },
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage Updated Successfully"));
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// GET PROFILE OF USER CHANNEL CONTROLLER
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            // $in:- look for value inside array or object
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// GET WATCH HISTORY CONTROLLER
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id), //here we need mongodb id not just string
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0].watchHistory),
      "watchHistory fetched successfully"
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
