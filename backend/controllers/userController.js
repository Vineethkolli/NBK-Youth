import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';

export const userController = {
  // Update profile image
  updateProfileImage: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const originalImage = user.profileImage;

      // Delete old image from Cloudinary if exists
      if (user.profileImage) {
        const publicId = user.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`ProfileImages/${publicId}`);
      }

      // Upload new image
      const imageUrl = await uploadToCloudinary(req.body.image, 'ProfileImages');
      
      // Update user profile
      user.profileImage = imageUrl;
      await user.save();

      // Log profile image update
      await logActivity(
        req,
        'UPDATE',
        'User',
        user.registerId,
        { before: { profileImage: originalImage }, after: { profileImage: imageUrl } },
        `Profile image updated by ${user.name}`
      );

      res.json({ profileImage: imageUrl });
    } catch (error) {
      console.error('Profile image update error:', error);
      res.status(500).json({ message: 'Failed to update profile image' });
    }
  }
};