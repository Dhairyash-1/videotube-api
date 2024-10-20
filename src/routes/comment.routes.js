import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../validators/validate.js";
import {
  getVideoCommentsValidator,
  addCommentValidator,
  deleteCommentValidator,
  updateCommentValidator,
} from "../validators/comment.validator.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/:videoId")
  .get(getVideoCommentsValidator(), validate, getVideoComments)
  .post(addCommentValidator(), validate, addComment);
router
  .route("/c/:commentId")
  .delete(deleteCommentValidator(), validate, deleteComment)
  .patch(updateCommentValidator(), validate, updateComment);

export default router;
