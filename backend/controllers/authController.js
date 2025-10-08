import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { logActivity } from '../middleware/activityLogger.js';
import * as UAParser from 'ua-parser-js';
import fetch from 'node-fetch'; // for IP geolocation

export const signUp = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, language } = req.body;
    if (!name || !phoneNumber || !password) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists) return res.status(400).json({ message: 'User already exists' });

    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email: email || undefined,
      phoneNumber,
      password,
      language: language || 'en'
    });

    await logActivity(
      { user: { registerId: user.registerId, name: user.name }, ip: req.ip, get: req.get.bind(req) },
      'CREATE',
      'User',
      user.registerId,
      { before: null, after: { name: user.name, email: user.email, phoneNumber: user.phoneNumber, role: user.role } },
      `User ${user.name} registered with phone ${user.phoneNumber}`
    );

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
        role: user.role,
        language: user.language,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const signIn = async (req, res) => {
  try {
    const { identifier, password, language } = req.body;

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phoneNumber: identifier }
      ]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Device info
const parser = new UAParser.UAParser(req.headers['user-agent']);
const deviceName = `${parser.getDevice().vendor || ''} ${parser.getDevice().model || ''} (${parser.getOS().name} ${parser.getOS().version})`;

    // Location from IP
    let location = 'Unknown';
    try {
      const ip = req.ip === '::1' ? 'YOUR_PUBLIC_IP' : req.ip; // localhost fallback
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const geoData = await geoRes.json();
      location = `${geoData.city || 'Unknown City'}, ${geoData.region || ''}, ${geoData.country_name || ''}`;
    } catch (err) {
      console.warn('Failed to fetch geolocation:', err);
    }

    await logActivity(
      {
        user: { registerId: user.registerId, name: user.name },
        ip: req.ip,
        get: req.get.bind(req),
        device: deviceName,
        location
      },
      'UPDATE',
      'User',
      user.registerId,
      { before: null, after: null },
      `User ${user.name} signed in from ${deviceName}, ${location}`
    );

    // Update language if different
    if (language && language !== user.language) {
      user.language = language;
      await user.save();
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
        role: user.role,
        language: user.language,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, otp });

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) return res.status(500).json({ message: 'Failed to send OTP email' });

    return res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });

    await OTP.deleteOne({ _id: otpRecord._id });
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });

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
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    await logActivity(
      { user: { registerId: user.registerId, name: user.name }, ip: req.ip, get: req.get.bind(req) },
      'UPDATE',
      'User',
      user.registerId,
      { before: null, after: null },
      `User ${user.name} has reset their password`
    );

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

    await logActivity(
      req,
      'UPDATE',
      'User',
      req.user.registerId,
      { before: null, after: null },
      `User ${req.user.name} changed password`
    );

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
