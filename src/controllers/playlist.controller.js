import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!(name && description)) {
    throw new ApiError(400, "Playlist name and description required");
  }
  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "playlist creation is failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "New Playlist is created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId is not vaild");
  }

  const userPlaylistswithVideos = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        createdAt: 1,
        updatedAt: 1,
        videos: {
          _id: 1,
          name: 1,
          description: 1,
          views: 1,
          videoFile: 1,
          thumbnail: 1,
          durations: 1,
        },
      },
    },
  ]);

  if (!userPlaylistswithVideos.length) {
    throw new ApiError(500, "User Playlist cannot be fetched");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userPlaylistswithVideos,
        "User Playlists fetched successfully"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlist id is not vaild");
  }
  const playlist = await Playlist.findOne({ _id: playlistId });

  if (!playlist) {
    throw new ApiError(500, "No Playlist found with given playlist Id ");
  }

  const playlistVideos = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        createdAt: 1,
        updatedAt: 1,
        videos: {
          _id: 1,
          name: 1,
          description: 1,
          views: 1,
          videoFile: 1,
          thumbnail: 1,
          durations: 1,
          isPublished: 1,
        },
        owner: {
          username: 1,
          email: 1,
          avatar: 1,
          fullName: 1,
        },
      },
    },
  ]);

  if (!playlistVideos.length) {
    throw new ApiError(500, "Playlist Fetching failed");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistVideos[0], "Playlist Fetched Successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Playlist Id or Video Id is not vaild");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  // Check is owner adding video to the playlist
  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only Owner Can Add Video to their playlist");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const isVideoExistInPlaylist = playlist.videos.includes(videoId);

  if (isVideoExistInPlaylist) {
    throw new ApiError(409, "Video is already present in playlist");
  }

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatePlaylist) {
    throw new ApiError(500, "Video Adding to Playlist failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatePlaylist, "New Video Added To Playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Playlist Id or Video Id is invaild");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist is not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(409, "Only Owner can remove video from this playlist");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const removeVideo = await Playlist.findByIdAndUpdate(playlist._id, {
    $pull: { videos: videoId },
  });

  if (!removeVideo) {
    throw new ApiError(500, "Remove video from playlist is failed.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video is removed from Playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist Id is not vaild");
  }
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(500, "Playlist is not found");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only Owner can delete this playlist");
  }

  await Playlist.findByIdAndDelete(playlist?._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted Successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist Id is not vaild");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(500, "Playlist is not exist");
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to update this playlist because you are not the owner."
    );
  }

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlist._id,
    {
      name: name,
      description: description,
    },
    { new: true }
  );
  if (!updatePlaylist) {
    throw new ApiError(500, "Playlist is not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatePlaylist, "Playlist Updated Successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
