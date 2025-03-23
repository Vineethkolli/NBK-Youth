import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Update profile image
export const updateProfileImage = async (req, res) => {
  try {
    // For example, assume the image URL is sent in the body
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.profileImage = req.body.imageUrl || user.profileImage;
    await user.save();
    res.json({ message: 'Profile image updated successfully', profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { category: req.body.category },
      { new: true }
    ).select('-password');
    
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
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { role: req.body.role },
      { new: true }
    ).select('-password');
    
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
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update language preference' });
  }
};