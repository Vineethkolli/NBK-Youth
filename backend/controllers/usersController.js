import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../middleware/activityLogger.js';
import cloudinary, { uploadToCloudinary } from '../config/cloudinary.js';

export const updateProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const originalImage = user.profileImage;



    // Delete old image from Cloudinary if it exists
    if (user.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImagePublicId, { resource_type: 'image' });
      } catch (err) {
        console.warn('Failed to delete old Cloudinary image:', err);
      }
    }

    // Upload new image to Cloudinary
    let uploadResult = undefined;
    if (req.file) {
      uploadResult = await uploadToCloudinary(req.file.buffer, 'ProfileImages', 'image');
    } else {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Update user profile image and publicId
    user.profileImage = uploadResult.secure_url;
    user.profileImagePublicId = uploadResult.public_id;
    await user.save();

    // Log profile image update
    await logActivity(
      req,
      'UPDATE',
      'User',
      user.registerId,
      { before: { profileImage: originalImage, profileImagePublicId: user.profileImagePublicId }, after: { profileImage: user.profileImage, profileImagePublicId: user.profileImagePublicId } },
      `Profile image updated by ${user.name}`
    );

    res.json({ message: 'Profile image updated successfully', profileImage: user.profileImage, profileImagePublicId: user.profileImagePublicId });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'Failed to update profile image' });
  }
};


export const deleteProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const originalImage = user.profileImage;

    // Delete image from Cloudinary if it exists
    if (user.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImagePublicId, { resource_type: 'image' });
      } catch (err) {
        console.warn('Failed to delete Cloudinary image:', err);
      }
    }

    // Remove profile image and publicId from user
    user.profileImage = null;
    user.profileImagePublicId = null;
    await user.save();

    // Log profile image deletion
    await logActivity(
      req,
      'DELETE',
      'User',
      user.registerId,
      { before: { profileImage: originalImage }, after: { profileImage: null } },
      `Profile image deleted by ${user.name}`
    );

    res.json({ message: 'Profile image deleted successfully', profileImage: null });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({ message: 'Failed to delete profile image' });
  }
};


// Get all users (developer only) with notification status
export const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { registerId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query).select('-password');
    const usersWithNotificationStatus = await Promise.all(
      users.map(async (user) => {
        const notificationRecord = await Notification.findOne({ registerId: user.registerId });
        const notificationsEnabled = notificationRecord &&
          notificationRecord.subscriptions &&
          notificationRecord.subscriptions.length > 0;
        return { ...user.toObject(), notificationsEnabled };
      })
    );
    
    res.json(usersWithNotificationStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const originalData = { name: user.name, email: user.email, phoneNumber: user.phoneNumber };

    // Prevent updating default developer email
    if (user.email === 'gangavaramnbkyouth@gmail.com' && email !== 'gangavaramnbkyouth@gmail.com') {
      return res.status(403).json({ message: 'Cannot change default developer email' });
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Check if phone number is already taken by another user
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }
    
    user.name = name || user.name;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    
    await user.save();
    res.json(user);
    // Log profile update
    await logActivity(
      req,
      'UPDATE',
      'User',
      user.registerId,
      { before: originalData, after: { name: user.name, email: user.email, phoneNumber: user.phoneNumber } },
      `User ${user.name} updated profile`
    );

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user category (developer only)
export const updateUserCategory = async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.userId);
    
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent category change for default developer account
    if (userToUpdate.email === 'gangavaramnbkyouth@gmail.com') {
      return res.status(403).json({ message: 'Cannot change default developer category' });
    }
    
    const originalCategory = userToUpdate.category;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { category: req.body.category },
      { new: true }
    ).select('-password');
    
    // Log category update
    await logActivity(
      req,
      'UPDATE',
      'User',
      updatedUser.registerId,
      { before: { category: originalCategory }, after: { category: updatedUser.category } },
      `User ${updatedUser.name} category changed from ${originalCategory} to ${updatedUser.category} by ${req.user.name}`
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user (developer only)
export const deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.userId);
    
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deletion of default developer account
    if (userToDelete.email === 'gangavaramnbkyouth@gmail.com') {
      return res.status(403).json({ message: 'Cannot delete default developer account' });
    }
    
    const originalData = userToDelete.toObject();

    // Log user deletion
    await logActivity(
      req,
      'DELETE',
      'User',
      userToDelete.registerId,
      { before: originalData, after: null },
      `User ${userToDelete.name} deleted by ${req.user.name}`
    );

    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user role (developer only)
export const updateUserRole = async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.userId);
    
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent role change for default developer account
    if (userToUpdate.email === 'gangavaramnbkyouth@gmail.com') {
      return res.status(403).json({ message: 'Cannot change default developer role' });
    }
    
    const originalRole = userToUpdate.role;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { role: req.body.role },
      { new: true }
    ).select('-password');
    
    // Log role update
    await logActivity(
      req,
      'UPDATE',
      'User',
      updatedUser.registerId,
      { before: { role: originalRole }, after: { role: updatedUser.role } },
      `User ${updatedUser.name} role changed from ${originalRole} to ${updatedUser.role} by ${req.user.name}`
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update language preference
export const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const originalLanguage = req.user.language;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language },
      { new: true }
    ).select('-password');

    // Log language update
    await logActivity(
      req,
      'UPDATE',
      'User',
      user.registerId,
      { before: { language: originalLanguage }, after: { language } },
      `User ${user.name} changed language from ${originalLanguage} to ${language}`
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update language preference' });
  }
};