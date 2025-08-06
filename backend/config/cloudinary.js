import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


export const uploadToCloudinary = async (file, folder = 'PaymentScreenshots', type = null) => {
  try {
    // file: should be a file path or a readable stream
    const options = {
      folder,
      resource_type: 'auto',
      quality: 'auto:good',
    };

    // Set resource_type based on folder logic and type
    if ([
      'PaymentScreenshots',
      'ExpenseBills',
      'ProfileImages'
    ].includes(folder)) {
      options.resource_type = 'image';
    } else if (folder === 'Vibe') {
      // Cloudinary treats audio as 'video' resource_type
      options.resource_type = 'video';
    } else if (folder === 'Banners' || folder === 'HomepageSlides') {
      // For Banners and HomepageSlides, support both image and video uploads
      // The actual resource_type should be set by the route/controller based on file type, but default to 'auto' here
      if (type === 'video') {
        options.resource_type = 'video';
      } else if (type === 'image') {
        options.resource_type = 'image';
      } else {
        options.resource_type = 'auto';
      }
    }

    // If resource_type is video (for large videos), set eager_async and eager transformation
    if (options.resource_type === 'video') {
      options.eager_async = true;
      options.eager = [{ format: 'mp4' }]; // You can add width/height/crop if needed
    }

    const result = await cloudinary.uploader.upload(file, options);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

export default cloudinary;