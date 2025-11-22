import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';
import { normalizePhoneNumber } from '../utils/phoneValidation.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, ...publicUser } = user;
    publicUser.hasPassword = Boolean(password);

    res.json(publicUser);

  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateProfile = async (req, res) => {
  try {
    let { name, email, phoneNumber } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const originalData = {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber
    };

    const normalizedEmail = email?.trim().toLowerCase();

    if (
      user.email === 'gangavaramnbkyouth@gmail.com' &&
      normalizedEmail !== user.email
    ) {
      return res
        .status(403)
        .json({ message: 'Cannot change default developer email' });
    }

    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (normalizedEmail !== user.email) {
        const emailExists = await User.findOne({ email: normalizedEmail }).lean();
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
    }

    if (
      phoneNumber &&
      phoneNumber.trim() &&
      user.email !== 'gangavaramnbkyouth@gmail.com'
    ) {
      phoneNumber = normalizePhoneNumber(phoneNumber);

      if (!phoneNumber) {
        return res.status(400).json({
          message: 'Please enter a valid phone number in international format'
        });
      }

      if (phoneNumber !== user.phoneNumber) {
        const phoneExists = await User.findOne({ phoneNumber }).lean();
        if (phoneExists) {
          return res.status(400).json({ message: 'Phone number already in use' });
        }
      }
    }

    user.name = name || user.name;
    user.email = normalizedEmail || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    if (normalizedEmail && normalizedEmail !== originalData.email) {
      if (user.googleId) {
        user.googleId = null;
        await logActivity(
          req,
          'UPDATE',
          'User',
          user.registerId,
          { before: { googleId: 'connected' }, after: { googleId: null } },
          `Google account auto-removed due to email change by ${user.name}`
        );
      }
    }

    await user.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      user.registerId,
      { before: originalData, after: { name, email, phoneNumber } },
      `User ${user.name} updated profile`
    );

    res.json({
      ...user.toObject(),
      password: undefined,
      hasPassword: Boolean(user.password)
    });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { language },
      { new: true }
    ).select('-password');

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
    res
      .status(500)
      .json({ message: 'Failed to update language preference' });
  }
};



export const updateProfileImage = async (req, res) => {
  try {
    const { profileImage, profileImagePublicId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!profileImage || !profileImagePublicId) {
      return res
        .status(400)
        .json({ message: 'Missing uploaded image details' });
    }

    if (user.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.profileImagePublicId, {
          resource_type: 'image'
        });
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

    res.json({
      message: 'Profile image updated successfully',
      profileImage
    });
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
        await cloudinary.uploader.destroy(user.profileImagePublicId, {
          resource_type: 'image'
        });
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

    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      if (!(await user.comparePassword(currentPassword))) {
        return res
          .status(401)
          .json({ message: 'Current password is incorrect' });
      }
    }

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    user.password = newPassword;

    await user.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      req.user.registerId,
      { before: null, after: null },
      `User ${req.user.name} ${user.password ? 'changed' : 'set'} password`
    );

    const userResponse = {
      ...user.toObject(),
      password: undefined,
      hasPassword: true
    };

    res.json({
      message: 'Password updated successfully',
      hasPassword: true,
      user: userResponse
    });

  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};


export const linkGoogleAccount = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { email: googleEmail, sub: googleId } = payload;
    const normalizedGoogleEmail = googleEmail.trim().toLowerCase();

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (normalizedGoogleEmail !== user.email) {
      return res.status(400).json({
        message: 'Cannot connect Google: Email mismatch. Change your email in profile to connect this Google account'
      });
    }

    const existingGoogleUser = await User.findOne({ googleId });
    if (existingGoogleUser && existingGoogleUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        message: 'This Google account is already linked to another user'
      });
    }

    user.googleId = googleId;
    await user.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      user.registerId,
      { before: { googleId: null }, after: { googleId } },
      `User ${user.name} linked Google account`
    );

    res.json({ 
      message: 'Google account linked successfully', 
      googleId: user.googleId 
    });

  } catch (error) {
    console.error('Link Google account error:', error);
    res.status(500).json({ message: 'Failed to link Google account' });
  }
};


export const unlinkGoogleAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.googleId) {
      return res.status(400).json({ message: 'No Google account linked' });
    }

    user.googleId = null;
    await user.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      user.registerId,
      { before: { googleId: 'connected' }, after: { googleId: null } },
      `User ${user.name} removed Google account connection`
    );

    res.json({ message: 'Google account unlinked successfully' });
  } catch (error) {
    console.error('Unlink Google account error:', error);
    res.status(500).json({ message: 'Failed to unlink Google account' });
  }
};
