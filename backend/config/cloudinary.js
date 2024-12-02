import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (file, type = 'image') => {
  try {
    // Remove the data:[content-type];base64, prefix
    const base64Data = file.replace(/^data:([^;]+);base64,/, '');
    
    const options = {
      resource_type: type,
      quality: 'auto:good'
    };

    // Add specific folder and options based on type
    if (type === 'image') {
      options.folder = 'PaymentScreenshots';
      options.format = 'jpg';
    } else if (type === 'audio') {
      options.folder = 'Vibe';
      options.resource_type = 'auto';
      options.format = 'mp3'; // Default format for audio
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:${type === 'image' ? 'image/png' : 'audio/mpeg'};base64,${base64Data}`,
      options
    );

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

export default cloudinary;