import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// GET VIDEO COMMENTS CONTROLLER
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "No video found with this videoId");
  }

  const findComments = Comment.aggregate([
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
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
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        likesCount: 1,
        createdAt: 1,
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
        isLiked: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const paginatedComments = await Comment.aggregatePaginate(
    findComments,
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, paginatedComments, "Comments fetched successfully")
    );
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// ADD COMMENT CONTROLLER
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId is not vaild");
  }
  if (!content.trim()) {
    throw new ApiError(400, "Content is required to make comment");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "Comment cannot be created");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment is made successfully"));
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// UPDATE COMMENT CONTROLLER
const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "commentId is not vaild");
  }
  if (!content.trim()) {
    throw new ApiError(400, "Content is required to update the comment");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment is not exist");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(409, "Only comment owner can update this comment");
  }

  const newComment = await Comment.findByIdAndUpdate(
    comment._id,
    {
      content: content,
    },
    { new: true }
  );

  if (!newComment) {
    throw new ApiError(500, "Comment update is failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment is updated successfully"));
});

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// DELETE COMMENT CONTROLLER
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "commentId is not vaild");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment is not exist");
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(409, "Only comment owner can delete this comment");
  }

  await Comment.findByIdAndDelete(comment._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment is deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
