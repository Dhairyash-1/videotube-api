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
  //TODO: get all videos based on query, sort, pagination
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
  //TODO: get video by id

  if (!isValidObjectId(videoId))
    throw new ApiError(400, "VideoId is not vaild");

  const video = await Video.findById(videoId);

  if (!video || video.length === 0) {
    throw new ApiError(404, "No video found for this videoId");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
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
