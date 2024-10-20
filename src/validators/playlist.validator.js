import { body, param } from "express-validator";

const createPlaylistValidator = () => {
  return [
    body("name").trim().notEmpty().withMessage("Playlist Name is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Playlist description is required"),
  ];
};

const getUserPlaylistsValidator = () => {
  return [
    param("userId")
      .trim()
      .notEmpty()
      .withMessage("UserId is required to get user playlist")
      .isMongoId()
      .withMessage("UserId is not valid"),
  ];
};

const getPlaylistByIdValidator = () => {
  return [
    param("playlistId")
      .trim()
      .notEmpty()
      .withMessage("Playlist Id is required")
      .isMongoId()
      .withMessage("Playlist Id is not valid"),
  ];
};

const addVideoToPlaylistValidator = () => {
  return [
    param("playlistId")
      .trim()
      .notEmpty()
      .withMessage("Playlist ID is required")
      .isMongoId()
      .withMessage("Playlist ID is not valid"),
    param("videoId")
      .trim()
      .notEmpty()
      .withMessage("Video ID is required")
      .isMongoId()
      .withMessage("Video ID is not valid"),
  ];
};

const removeVideoFromPlaylistValidator = () => {
  return [
    param("playlistId")
      .trim()
      .notEmpty()
      .withMessage("Playlist ID is required")
      .isMongoId()
      .withMessage("Playlist ID is not valid"),
    param("videoId")
      .trim()
      .notEmpty()
      .withMessage("Video ID is required")
      .isMongoId()
      .withMessage("Video ID is not valid"),
  ];
};

const deletePlaylistValidator = () => {
  return [
    param("playlistId")
      .trim()
      .notEmpty()
      .withMessage("Playlist ID is required")
      .isMongoId()
      .withMessage("Playlist ID is not valid"),
  ];
};

const updatePlaylistValidator = () => {
  return [
    param("playlistId")
      .trim()
      .notEmpty()
      .withMessage("Playlist ID is required")
      .isMongoId()
      .withMessage("Playlist ID is not valid"),
    body("name").trim().notEmpty().withMessage("Playlist Name is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Playlist description is required"),
  ];
};

export {
  createPlaylistValidator,
  updatePlaylistValidator,
  deletePlaylistValidator,
  addVideoToPlaylistValidator,
  removeVideoFromPlaylistValidator,
  getPlaylistByIdValidator,
  getUserPlaylistsValidator,
};
