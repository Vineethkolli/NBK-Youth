import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file, folder) => {
  try {
    // Remove the data:image/[type];base64, prefix
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');

    // Upload to Cloudinary with specified folder
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Data}`,
      {
        folder, // Dynamic folder
        resource_type: 'image',
        format: 'jpg', // Convert all images to jpg
        quality: 'auto:good', // Optimize quality
        fetch_format: 'auto',
      }
    );

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export default cloudinary;
