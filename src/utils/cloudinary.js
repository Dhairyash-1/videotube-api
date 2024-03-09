import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "chai-backend",
    });

    // file has been uploaded successfully
    // console.log(`Cloudinary response: `, response);
    // console.log(`file is uploaded on cloudinary: `, response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved file as file upload successfull
  }
};

const deleteResourceOnCloudinary = async (publicId) => {
  // console.log("--publicId", publicId);
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      folder: "chai-backend",
    });

    return response;
  } catch (error) {
    console.error(`Error on deleteing resource from cloudinary`, error);
  }
};

export { uploadOnCloudinary, deleteResourceOnCloudinary };
