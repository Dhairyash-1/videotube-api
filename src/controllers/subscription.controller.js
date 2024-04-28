import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// TOGGLE SUBSCRIPTION CONTROLLER
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "channelId is invaild");
  }

  const existingSubscriber = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (existingSubscriber) {
    // If the subscriber exists, delete it (unsubscribe)
    await Subscription.findByIdAndDelete(existingSubscriber._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Channel unsubscribed successfully"));
  } else {
    // If the subscriber does not exist, create it (subscribe)
    const newSubscriber = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, newSubscriber, "Channel subscribed Successfully")
      );
  }
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// GET SUBSCRIBERS OF CHANNEL CONTROLLER
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "channelId is invaild");
  }

  // find the subscribers of channels
  const subscribers = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "subscriber",
              foreignField: "_id",
              as: "subscriberInfo",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    email: 1,
                    username: 1,
                    thumbnail: 1,
                    coverImage: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$subscriberInfo",
          },
        ],
      },
    },
    {
      $project: {
        watchHistory: 0,
        refreshToken: 0,
        password: 0,
        avatar: 0,
        coverImage: 0,
      },
    },
  ]);

  if (!subscribers || !subscribers.length) {
    throw new ApiError(500, "Cannot Found this channel Subscribers ");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers[0],
        "Channel Subscribers List Fetched Successfully"
      )
    );
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// GET CHANNELS TO WHICH USER SUBSCRIBED CONTROLLER
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "subscriberId is invaild");
  }

  const subscribedToChannels = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedToChannels",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "channel",
              foreignField: "_id",
              as: "channelOwnerInfo",
              pipeline: [
                {
                  $project: {
                    password: 0,
                    watchHistory: 0,
                    refreshToken: 0,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$channelOwnerInfo",
          },
        ],
      },
    },
    {
      $project: {
        watchHistory: 0,
        refreshToken: 0,
        password: 0,
        avatar: 0,
        coverImage: 0,
      },
    },
  ]);

  if (!subscribedToChannels || !subscribedToChannels.length) {
    throw new ApiError(500, "Error in getting subscribed channels list");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedToChannels[0],
        "Subscribed channel fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
