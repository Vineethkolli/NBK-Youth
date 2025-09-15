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

      // Enforce: at least one of title, message, image, or video
      if (
        !title &&
        !message &&
        !(req.files?.image?.[0]) &&
        !(req.files?.video?.[0])
      ) {
        return res.status(400).json({
          message: 'At least one of title, message, image, or video must be provided'
        });
      }

      // If trying to enable this banner, check if any other banner is enabled
      if (status === 'enabled') {
        const enabledBanner = await Banner.findOne({ status: 'enabled' });
        if (enabledBanner) {
          return res.status(400).json({ 
            message: 'Please disable the currently enabled banner first' 
          });
        }
      }

      let imageUrl, videoUrl, imagePublicId, videoPublicId;

      if (req.files?.image?.[0]) {
        const imageResult = await uploadToCloudinary(req.files.image[0].buffer, 'Banners', 'image');
        imageUrl = imageResult.secure_url;
        imagePublicId = imageResult.public_id;
      }
      if (req.files?.video?.[0]) {
        const videoResult = await uploadToCloudinary(req.files.video[0].buffer, 'Banners', 'video');
        videoUrl = videoResult.secure_url;
        videoPublicId = videoResult.public_id;
      }

      const banner = await Banner.create({
        title,
        message,
        image: imageUrl,
        imagePublicId,
        video: videoUrl,
        videoPublicId,
        periodicity: periodicity || 1,
        duration: duration || 0,
        status: status || 'disabled',
        createdBy: req.user.registerId
      });

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
      const { title, message, periodicity, duration, status, deleteImage, deleteVideo, deleteImageCloudinary, deleteVideoCloudinary } = req.body;

      const originalBanner = await Banner.findById(req.params.id);
      if (!originalBanner) {
        return res.status(404).json({ message: 'Banner not found' });
      }
      const originalData = originalBanner.toObject();

      // Enforce: at least one of title, message, image, or video
      const hasTitle = title || originalBanner.title;
      const hasMessage = message || originalBanner.message;
      const hasImage = req.files?.image?.[0] || (originalBanner.image && !(deleteImage === 'true' || deleteImageCloudinary === 'true'));
      const hasVideo = req.files?.video?.[0] || (originalBanner.video && !(deleteVideo === 'true' || deleteVideoCloudinary === 'true'));

      if (!hasTitle && !hasMessage && !hasImage && !hasVideo) {
        return res.status(400).json({
          message: 'At least one of title, message, image, or video must be provided'
        });
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
      let imagePublicId = originalBanner.imagePublicId;
      let videoPublicId = originalBanner.videoPublicId;

      // Handle Cloudinary deletion if requested
      if ((deleteImage === 'true' || deleteImageCloudinary === 'true') && originalBanner.image?.includes('cloudinary.com')) {
        try {
          await cloudinary.uploader.destroy(imagePublicId || '');
          imageUrl = undefined;
          imagePublicId = undefined;
        } catch (err) {
          console.warn('Failed to delete banner image from Cloudinary:', err);
        }
      }
      if ((deleteVideo === 'true' || deleteVideoCloudinary === 'true') && originalBanner.video?.includes('cloudinary.com')) {
        try {
          await cloudinary.uploader.destroy(videoPublicId || '', { resource_type: 'video' });
          videoUrl = undefined;
          videoPublicId = undefined;
        } catch (err) {
          console.warn('Failed to delete banner video from Cloudinary:', err);
        }
      }

      const updateOps = {
        $set: { title, message, periodicity, duration, status },
      };

      // Handle new image upload
      if (req.files?.image?.[0]) {
        const imageResult = await uploadToCloudinary(req.files.image[0].buffer, 'Banners', 'image');
        imageUrl = imageResult.secure_url;
        imagePublicId = imageResult.public_id;
        updateOps.$set.image = imageUrl;
        updateOps.$set.imagePublicId = imagePublicId;
      } else if (deleteImage === 'true' || deleteImageCloudinary === 'true') {
        updateOps.$unset = { ...(updateOps.$unset || {}), image: "", imagePublicId: "" };
      }

      // Handle new video upload
      if (req.files?.video?.[0]) {
        const videoResult = await uploadToCloudinary(req.files.video[0].buffer, 'Banners', 'video');
        videoUrl = videoResult.secure_url;
        videoPublicId = videoResult.public_id;
        updateOps.$set.video = videoUrl;
        updateOps.$set.videoPublicId = videoPublicId;
      } else if (deleteVideo === 'true' || deleteVideoCloudinary === 'true') {
        updateOps.$unset = { ...(updateOps.$unset || {}), video: "", videoPublicId: "" };
      }

      const banner = await Banner.findByIdAndUpdate(
        req.params.id,
        updateOps,
        { new: true }
      );

      if (!banner) {
        return res.status(404).json({ message: 'Banner not found' });
      }

      await logActivity(
        req,
        'UPDATE',
        'Banner',
        banner._id.toString(),
        { before: originalData, after: banner.toObject() },
        `Banner "${title || originalBanner.title || 'Untitled'}" updated by ${req.user.name}`
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
      if (banner.image?.includes('cloudinary.com') && banner.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(banner.imagePublicId);
        } catch (err) {
          console.warn('Failed to delete banner image from Cloudinary:', err);
        }
      }

      // Delete video from Cloudinary if it exists
      if (banner.video?.includes('cloudinary.com') && banner.videoPublicId) {
        try {
          await cloudinary.uploader.destroy(banner.videoPublicId, { resource_type: 'video' });
        } catch (err) {
          console.warn('Failed to delete banner video from Cloudinary:', err);
        }
      }

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
