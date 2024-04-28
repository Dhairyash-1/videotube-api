import mongoose, { mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// GET STATS OF CHANNEL CONTROLLER
const getChannelStats = asyncHandler(async (req, res) => {
  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(req.user?._id) },
    },
    {
      $group: {
        _id: null,
        totalSubscribersCount: { $sum: 1 },
      },
    },
  ]);

  const videoAggregate = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likeCount: { $size: "$likes" },
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: "$likeCount" },
      },
    },
  ]);

  const channelStats = {
    subscribersCount: subscribers[0].totalSubscribersCount,
    totalViews: videoAggregate[0]?.totalViews,
    totalLikes: videoAggregate[0]?.totalLikes,
    totalVideos: videoAggregate[0]?.totalVideos,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "Channel Stats fetched successfully")
    );
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// GET CHANNEL VIDEOS CONTROLLER
const getChannelVideos = asyncHandler(async (req, res) => {
  const getAllVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $project: {
        likes: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getAllVideos,
        "All channel videos fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
