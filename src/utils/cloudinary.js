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
      media_metadata: true,
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

const deleteResourceOnCloudinary = async (url, type) => {
  // console.log("url", url);
  let publicId;

  // Check if the URL includes the Cloudinary domain
  if (url.includes("res.cloudinary.com")) {
    const parts = url.split("/");
    const publicIdIndex = parts.indexOf("upload") + 2;
    publicId = parts.slice(publicIdIndex).join("/").slice(0, -4);
  } else {
    // If it's not a Cloudinary URL, assume it's already the publicId
    publicId = url;
  }

  // console.log("publicId", publicId);

  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: type || "image",
      folder: "chai-backend",
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(`Error on deleting resource from Cloudinary`, error);
  }
};

export { uploadOnCloudinary, deleteResourceOnCloudinary };
