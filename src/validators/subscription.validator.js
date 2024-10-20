import { param } from "express-validator";

const toggleSubscriptionValidator = () => {
  return [
    param("channelId")
      .trim()
      .notEmpty()
      .withMessage("Channel ID is required")
      .isMongoId()
      .withMessage("Channel ID is invaild"),
  ];
};

const getUserChannelSubscribersValidator = () => {
  return [
    param("channelId")
      .trim()
      .notEmpty()
      .withMessage("Channel ID is required")
      .isMongoId()
      .withMessage("Channel ID is invaild"),
  ];
};
const getSubscribedChannelsValidator = () => {
  return [
    param("subscriberId")
      .trim()
      .notEmpty()
      .withMessage("Subscriber ID is required")
      .isMongoId()
      .withMessage("Subscriber ID is invaild"),
  ];
};

export {
  toggleSubscriptionValidator,
  getUserChannelSubscribersValidator,
  getSubscribedChannelsValidator,
};
