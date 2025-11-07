import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';


export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateProfile = async (req, res) => {
  try {
    let { name, email, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const originalData = { name: user.name, email: user.email, phoneNumber: user.phoneNumber };
    const normalizedEmail = email?.trim().toLowerCase();

    // Developer account lock
    if (user.email === 'gangavaramnbkyouth@gmail.com' && normalizedEmail !== user.email)
      return res.status(403).json({ message: 'Cannot change default developer email' });

    // Email validation
    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail))
        return res.status(400).json({ message: 'Invalid email format' });

      if (normalizedEmail !== user.email) {
        const emailExists = await User.findOne({ email: normalizedEmail });
        if (emailExists) return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Phone normalization and validation (E.164)
    if (phoneNumber && phoneNumber.trim() && user.email !== 'gangavaramnbkyouth@gmail.com') {
      let normalized = phoneNumber.trim().replace(/^00/, '+').replace(/[\s-]+/g, '');
      let parsed;

      if (normalized.startsWith('+')) {
        parsed = parsePhoneNumberFromString(normalized);
      } else if (/^\d{6,15}$/.test(normalized)) {
        parsed = parsePhoneNumberFromString(`+${normalized}`);
      }

      if (!parsed || !parsed.isValid()) {
        return res.status(400).json({ message: 'Please enter a valid phone number in international format' });
      }

      phoneNumber = parsed.number;

      if (phoneNumber !== user.phoneNumber) {
        const phoneExists = await User.findOne({ phoneNumber });
        if (phoneExists) return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    user.name = name || user.name;
    user.email = normalizedEmail || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    await user.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      user.registerId,
      { before: originalData, after: { name, email, phoneNumber } },
      `User ${user.name} updated profile`
    );

    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { language }, { new: true }).select('-password');
    await logActivity(
      req,
      'UPDATE',
      'User',
      user.registerId,
      { before: { language: req.user.language }, after: { language } },
      `User ${user.name} changed language`
    );
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Failed to update language preference' });
  }
};


export const updateProfileImage = async (req, res) => {
  try {
    const { profileImage, profileImagePublicId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!profileImage || !profileImagePublicId)
      return res.status(400).json({ message: 'Missing uploaded image details' });

    if (user.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImagePublicId, { resource_type: 'image' });
      } catch (err) {
        console.warn('Failed to delete old Cloudinary image:', err);
      }
    }

    const originalImage = user.profileImage;
    user.profileImage = profileImage;
    user.profileImagePublicId = profileImagePublicId;
    await user.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      user.registerId,
      { before: { profileImage: originalImage }, after: { profileImage } },
      `Profile image updated by ${user.name}`
    );

    res.json({ message: 'Profile image updated successfully', profileImage });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile image' });
  }
};


export const deleteProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImagePublicId, { resource_type: 'image' });
      } catch (err) {
        console.warn('Failed to delete Cloudinary image:', err);
      }
    }

    user.profileImage = null;
    user.profileImagePublicId = null;
    await user.save();

    await logActivity(
      req,
      'DELETE',
      'User',
      user.registerId,
      { before: null, after: null },
      `Profile image deleted by ${user.name}`
    );

    res.json({ message: 'Profile image deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Failed to delete profile image' });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      req.user.registerId,
      { before: null, after: null },
      `User ${req.user.name} changed password`
    );

    res.json({ message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
