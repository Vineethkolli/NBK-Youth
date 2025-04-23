import Banner from '../models/Banner.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

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
      const { title, message, image, video, periodicity, duration, status } = req.body;

      // If trying to enable this banner, check if any other banner is enabled
      if (status === 'enabled') {
        const enabledBanner = await Banner.findOne({ status: 'enabled' });
        if (enabledBanner) {
          return res.status(400).json({ 
            message: 'Please disable the currently enabled banner first' 
          });
        }
      }

      let imageUrl = image;
      let videoUrl = video;

      // Handle file uploads if present
      if (image && image.startsWith('data:')) {
        imageUrl = await uploadToCloudinary(image, 'Banners');
      }
      if (video && video.startsWith('data:')) {
        videoUrl = await uploadToCloudinary(video, 'Banners');
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

      res.status(201).json(banner);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateBanner: async (req, res) => {
    try {
      const { title, message, image, video, periodicity, duration, status } = req.body;

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

      let imageUrl = image;
      let videoUrl = video;

      // Handle file uploads if present
      if (image && image.startsWith('data:')) {
        imageUrl = await uploadToCloudinary(image, 'Banners');
      }
      if (video && video.startsWith('data:')) {
        videoUrl = await uploadToCloudinary(video, 'Banners');
      }

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

      res.json(banner);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteBanner: async (req, res) => {
    try {
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