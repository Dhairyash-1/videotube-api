import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteResourceOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "UserId is not vaild");
  }

  // find video of the owner using userId
  const matchConditions = {
    owner: new mongoose.Types.ObjectId(userId),
  };

  // if query parameter is defined so find video that matched to query
  if (query) {
    const queryArr = query.split(" ");
    const regexConditions = queryArr.map((word) => ({
      $or: [
        {
          title: { $regex: new RegExp("\\b" + word + "\\b", "i") },
        },
        {
          description: { $regex: new RegExp("\\b" + word + "\\b", "i") },
        },
      ],
    }));

    // Use $or to match any condition in the array
    matchConditions.$or = regexConditions;
  }

  const sortOptions = {};
  if (sortBy && sortType) {
    // SortBy: createdAt or views or durations
    sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
  }

  const pipeline = [
    {
      $match: matchConditions,
    },
    ...(sortBy && sortType ? [{ $sort: sortOptions }] : []),
    {
      $skip: page ? (page - 1) * limit : 0,
    },
    {
      $limit: limit ? parseInt(limit) : 0,
    },
  ];

  // Find videos based on pipeline
  const videos = await Video.aggregate(pipeline);

  if (!videos || !videos.length) {
    throw new ApiError(500, "No Videos is found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "All Videos Fetched Successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!(title.trim() && description.trim())) {
    throw new ApiError(400, "Video title and description is required!");
  }

  const videoLocalPath = req.files?.videoFile[0].path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Video File is required");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video || !thumbnail) {
    throw new ApiError(400, "Video or thumbnail upload on cloudinary failed");
  }

  const videoUpload = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    title,
    description,
    durations: video.duration,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, videoUpload, "Video Uploaded Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId))
    throw new ApiError(400, "VideoId is not vaild");

  const videoAggregation = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    // find all the likes of given video
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          // find the channel subscribers using channel owner details
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: { $size: "$subscribers" },
              // Is LoggedIn user subscribed to given channel or not
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
        likesCount: { $size: "$likes" },
        // Is loggedIn user has liked the video or not
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        likes: 0,
      },
    },
  ]);

  if (!videoAggregation || videoAggregation.length === 0) {
    throw new ApiError(404, "No video found for this videoId");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, videoAggregation[0], "Video fetched successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, thumbnail } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "VideoId is not vaild");
  }

  //TODO: update video details like title, description, thumbnail
  if (!(title || description || thumbnail)) {
    throw new ApiError(400, "All fields are required to update Video");
  }

  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is missing");
  }

  const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!newThumbnail.url) {
    throw new ApiError(500, "Thumbnail upload on cloudinary failed");
  }

  const video = await Video.findById(videoId);
  await deleteResourceOnCloudinary(video.thumbnail);

  const videoUpdate = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: newThumbnail.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, videoUpdate, "Video Details Updated Successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "VideoId is not vaild");
  }

  const deleteVideo = await Video.findByIdAndDelete(videoId);
  if (!deleteVideo) {
    throw new ApiError(500, "Video not found or already deleted");
  }
  // delete the thumbnail and video from cloudinary
  await deleteResourceOnCloudinary(deleteVideo?.videoFile, "video");
  await deleteResourceOnCloudinary(deleteVideo?.thumbnail);

  console.log(deleteVideo);

  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully"));

  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "VideoId is not vaild");
  }

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(500, "Video not found");

  video.isPublished = !video.isPublished;
  const updatedVideo = await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "Video Publish Status Updated Successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
