import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
    avatar: avatar.url,
    email,
    coverImage: coverImage?.url || "",
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

export { registerUser };
