import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfully
    console.log(`file is uploaded on cloudinary: ${response.url}`);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved file as file upload successfull
  }
};

export { uploadOnCloudinary };
