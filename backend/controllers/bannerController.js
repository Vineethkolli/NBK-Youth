
import Banner from '../models/Banner.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';

export const bannerController = {
  getAllBanners: async (req, res) => {
    try {
      const banners = await Banner.find().sort('-createdAt');
      res.json(banners);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch banners' });
    }
  },

  createBanner: async (req, res) => {
    try {
      const { title, message, periodicity, duration, status } = req.body;

      // If trying to enable this banner, check if any other banner is enabled
      if (status === 'enabled') {
        const enabledBanner = await Banner.findOne({ status: 'enabled' });
        if (enabledBanner) {
          return res.status(400).json({ 
            message: 'Please disable the currently enabled banner first' 
          });
        }
      }

      let imageUrl = undefined;
      let videoUrl = undefined;

      // Use multer: req.files.image and req.files.video (field names must match in frontend)
      if (req.files && req.files.image && req.files.image[0]) {
        imageUrl = await uploadToCloudinary(req.files.image[0].buffer, 'Banners', 'image');
      }
      if (req.files && req.files.video && req.files.video[0]) {
        videoUrl = await uploadToCloudinary(req.files.video[0].buffer, 'Banners', 'video');
      }

      const banner = await Banner.create({
        title,
        message,
        image: imageUrl,
        video: videoUrl,
        periodicity: periodicity || 1,
        duration: duration || 0,
        status: status || 'disabled',
        createdBy: req.user.registerId
      });

      // Log banner creation
      await logActivity(
        req,
        'CREATE',
        'Banner',
        banner._id.toString(),
        { before: null, after: banner.toObject() },
        `Banner "${title || 'Untitled'}" created by ${req.user.name}`
      );

      res.status(201).json(banner);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateBanner: async (req, res) => {
    try {
      const { title, message, periodicity, duration, status, deleteImage, deleteVideo } = req.body;

      const originalBanner = await Banner.findById(req.params.id);
      if (!originalBanner) {
        return res.status(404).json({ message: 'Banner not found' });
      }

      // If trying to enable this banner, check if any other banner is enabled
      if (status === 'enabled') {
        const enabledBanner = await Banner.findOne({ 
          status: 'enabled',
          _id: { $ne: req.params.id }
        });
        if (enabledBanner) {
          return res.status(400).json({ 
            message: 'Please disable the currently enabled banner first' 
          });
        }
      }

      let imageUrl = originalBanner.image;
      let videoUrl = originalBanner.video;

      // Handle Cloudinary deletion if requested
      if (deleteImage === 'true' && originalBanner.image && originalBanner.image.includes('cloudinary.com')) {
        try {
          const publicId = originalBanner.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`Banners/${publicId}`);
          imageUrl = undefined;
        } catch (err) {
          console.warn('Failed to delete banner image from Cloudinary:', err);
        }
      }
      if (deleteVideo === 'true' && originalBanner.video && originalBanner.video.includes('cloudinary.com')) {
        try {
          const publicId = originalBanner.video.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`Banners/${publicId}`, { resource_type: 'video' });
          videoUrl = undefined;
        } catch (err) {
          console.warn('Failed to delete banner video from Cloudinary:', err);
        }
      }

      // Use multer: req.files.image and req.files.video (field names must match in frontend)
      if (req.files && req.files.image && req.files.image[0]) {
        imageUrl = await uploadToCloudinary(req.files.image[0].buffer, 'Banners', 'image');
      }
      if (req.files && req.files.video && req.files.video[0]) {
        videoUrl = await uploadToCloudinary(req.files.video[0].buffer, 'Banners', 'video');
      }

      const originalData = originalBanner.toObject();

      const banner = await Banner.findByIdAndUpdate(
        req.params.id,
        {
          title,
          message,
          image: imageUrl,
          video: videoUrl,
          periodicity,
          duration,
          status
        },
        { new: true }
      );

      if (!banner) {
        return res.status(404).json({ message: 'Banner not found' });
      }

      // Log banner update
      await logActivity(
        req,
        'UPDATE',
        'Banner',
        banner._id.toString(),
        { before: originalData, after: banner.toObject() },
        `Banner "${title || 'Untitled'}" updated by ${req.user.name}`
      );

      res.json(banner);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteBanner: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) {
        return res.status(404).json({ message: 'Banner not found' });
      }

      const originalData = banner.toObject();

      // Delete image from Cloudinary if it exists
      if (banner.image && banner.image.includes('cloudinary.com')) {
        try {
          const publicId = banner.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`Banners/${publicId}`);
        } catch (err) {
          console.warn('Failed to delete banner image from Cloudinary:', err);
        }
      }

      // Delete video from Cloudinary if it exists
      if (banner.video && banner.video.includes('cloudinary.com')) {
        try {
          const publicId = banner.video.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`Banners/${publicId}`, { resource_type: 'video' });
        } catch (err) {
          console.warn('Failed to delete banner video from Cloudinary:', err);
        }
      }

      // Log banner deletion
      await logActivity(
        req,
        'DELETE',
        'Banner',
        banner._id.toString(),
        { before: originalData, after: null },
        `Banner "${banner.title || 'Untitled'}" deleted by ${req.user.name}`
      );

      await Banner.findByIdAndDelete(req.params.id);
      res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete banner' });
    }
  },

  getActiveBanner: async (req, res) => {
    try {
      const banner = await Banner.findOne({ status: 'enabled' });
      res.json(banner);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch active banner' });
    }
  }
};