import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (file, folder = 'PaymentScreenshots') => {
  try {
    // Remove the data:[content-type];base64, prefix
    const base64Data = file.replace(/^data:([^;]+);base64,/, '');
    
    const options = {
      folder,
      resource_type: 'auto',
      quality: 'auto:good'
    };

    // Add specific options based on folder type
    if (folder === 'PaymentScreenshots' || folder === 'ExpenseBills') {
      options.format = 'jpg';
      options.resource_type = 'image';
    } else if (folder === 'Vibe') {
      options.format = 'mp3';
      options.resource_type = 'video'; 
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${options.resource_type === 'image' ? 'image/png' : 'audio/mpeg'};base64,${base64Data}`,
      options
    );

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

export default cloudinary;