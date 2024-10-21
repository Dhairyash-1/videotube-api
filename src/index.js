import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import logger from "./logger/winston.logger.js";
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("error", (err) => {
      logger.error("Err", err);
      throw err;
    });
    app.listen(process.env.PORT || 8000, () => {
      logger.info(`⚙️  Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    logger.error(`MONGODB conection failed !!`, err);
  });

/*
import express from "express";
const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Err", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`app is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
})();
*/
