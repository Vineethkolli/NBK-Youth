import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail } from '../utils/emailService.js';

export const signUp = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;
    if (!name || !phoneNumber || !password) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    // Check for existing user with same phone number
    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // If email is provided, check if it's already in use
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'User already exists' });
      }
    }
    const user = await User.create({
      name,
      email: email || undefined,
      phoneNumber,
      password
    });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '365d' }
    );
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const signIn = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phoneNumber: identifier }
      ]
    });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '365d' }
    );
    return res.json({
      token,
      user: {
        id: user._id,
        registerId: user.registerId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Save OTP to database
    await OTP.create({ email, otp });
    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }
    return res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    await OTP.deleteOne({ _id: otpRecord._id });
    // Generate temporary token for password reset
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    return res.json({ resetToken });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = newPassword;
    await user.save();
    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
