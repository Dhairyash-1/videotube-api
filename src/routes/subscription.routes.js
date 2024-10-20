import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  getSubscribedChannelsValidator,
  getUserChannelSubscribersValidator,
  toggleSubscriptionValidator,
} from "../validators/subscription.validator.js";
import { validate } from "../validators/validate.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/c/:subscriberId")
  .get(getSubscribedChannelsValidator(), validate, getSubscribedChannels);
router
  .route("/c/:channelId")
  .post(toggleSubscriptionValidator(), validate, toggleSubscription);

router
  .route("/u/:channelId")
  .get(
    getUserChannelSubscribersValidator(),
    validate,
    getUserChannelSubscribers
  );

export default router;
