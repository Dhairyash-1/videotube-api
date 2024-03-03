import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MONGODB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection FAILED", error);
    process.exit(1); // i want to exit the process with code 1
  }
}

export default connectDB;
