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
    const options = {
      folder,
      resource_type: 'auto',
      quality: 'auto:good',
    };

    // Decide resource_type
    if (folder === 'EventRecords') {
      options.resource_type = 'raw';
    } else if (['PaymentScreenshots', 'ExpenseBills', 'ProfileImages'].includes(folder)) {
      options.resource_type = 'image';
    } else if (folder === 'Vibe') {
      options.resource_type = 'video'; // audio treated as video
    } else if (folder === 'Banners' || folder === 'HomepageSlides') {
      if (type === 'video') options.resource_type = 'video';
      else if (type === 'image') options.resource_type = 'image';
      else options.resource_type = 'auto';
    }

    let result;
    if (Buffer.isBuffer(file)) {
      const { Readable } = await import('stream');
      const stream = Readable.from(file);
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, res) => {
          if (error) return reject(error);
          resolve(res);
        });
        stream.pipe(uploadStream);
      });
    } else if (file && typeof file.pipe === 'function') {
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, res) => {
          if (error) return reject(error);
          resolve(res);
        });
        file.pipe(uploadStream);
      });
    } else {
      result = await cloudinary.uploader.upload(file, options);
    }

    // Always return object with secure_url, public_id, and resource_type
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type || options.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

export default cloudinary;
