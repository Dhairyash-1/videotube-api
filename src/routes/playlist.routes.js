import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPlaylistValidator,
  deletePlaylistValidator,
  updatePlaylistValidator,
  addVideoToPlaylistValidator,
  removeVideoFromPlaylistValidator,
  getUserPlaylistsValidator,
  getPlaylistByIdValidator,
} from "../validators/playlist.validator.js";
import { validate } from "../validators/validate.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylistValidator(), validate, createPlaylist);

router
  .route("/:playlistId")
  .get(getPlaylistByIdValidator(), validate, getPlaylistById)
  .patch(updatePlaylistValidator(), validate, updatePlaylist)
  .delete(deletePlaylistValidator(), validate, deletePlaylist);

router
  .route("/add/:videoId/:playlistId")
  .patch(addVideoToPlaylistValidator(), validate, addVideoToPlaylist);
router
  .route("/remove/:videoId/:playlistId")
  .patch(removeVideoFromPlaylistValidator(), validate, removeVideoFromPlaylist);

router
  .route("/user/:userId")
  .get(getUserPlaylistsValidator(), validate, getUserPlaylists);

export default router;
