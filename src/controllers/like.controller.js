import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "VideoId is Invaild");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          "Video like removed successfully"
        )
      );
  }
  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "CommentId is Invaild");
  }

  const likedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          "Comment like removed successfully"
        )
      );
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isLiked: true }, "Comment liked successfully")
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "tweetId is Invaild");
  }

  const likedAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isLiked: false },
          "Tweet like removed successfully"
        )
      );
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideosAggregate = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
        video: { $exists: true }, // only documents that has video Property
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $project: {
        _id: 0,
        likedVideo: {
          thumbnail: 1,
          durations: 1,
          createdAt: 1,
          title: 1,
          videoFile: 1,
          thumbnail: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    },
    {
      $replaceRoot: { newRoot: "$likedVideo" }, // Replace root with the embedded document 'likedVideo'
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideosAggregate,
        "All Liked Video Fetched Successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
