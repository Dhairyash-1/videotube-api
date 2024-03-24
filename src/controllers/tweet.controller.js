import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const createTweet = await Tweet.create({
    content: content,
    owner: req.user?._id,
  });
  if (!createTweet) {
    throw new ApiError(500, "Tweet cannot be created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createTweet, "Tweet is created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId is not vaild");
  }
  const findTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        ownerDetails: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        owner: 0,
      },
    },
  ]);

  if (!findTweets.length) {
    throw new ApiError(500, "User tweet cannot be Fetched");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, findTweets, "User Tweet Fetched Successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;
  if (!content.trim()) {
    throw new ApiError(400, "content is required");
  }
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "userId is not vaild");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet is not exist");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(409, "Only owner can update the tweet");
  }

  const newTweet = await Tweet.findByIdAndUpdate(
    tweet._id,
    {
      content: content,
    },
    { new: true }
  );
  if (!newTweet) {
    throw new ApiError(500, "Tweet updation is failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newTweet, "Tweet is updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "userId is not vaild");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet is not exist");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(409, "Only owner can delete the tweet");
  }

  await Tweet.findByIdAndDelete(tweet._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet is deleted Successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
