import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { logActivity } from '../middleware/activityLogger.js';
import AuthLog from '../models/AuthLog.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Helper for Auth Logs
const logAuthEvent = async (data) => {
  try {
    setImmediate(async () => {
      await AuthLog.create(data);
    });
  } catch (error) {
    console.error('Auth log failed:', error.message);
  }
};


export const signUp = async (req, res) => {
  try {
    let { name, email, phoneNumber, password, language, deviceInfo } = req.body;
    if (!name || !phoneNumber || !password)
      return res.status(400).json({ message: 'Required fields missing' });

    // Phone NumberStrict validation
    // 📞 Strict International Phone Number Validation (E.164)
if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
  return res.status(400).json({ message: "Phone number required" });
}

phoneNumber = phoneNumber.trim();

// Normalize: Convert `00` prefix to `+`, and strip spaces/dashes
let normalized = phoneNumber.replace(/^00/, "+").replace(/[\s-]+/g, "");
let parsed;

// 1️⃣ Direct + prefixed number
if (normalized.startsWith("+")) {
  parsed = parsePhoneNumberFromString(normalized);
}
// 2️⃣ Raw digits (no prefix)
else if (/^\d{6,15}$/.test(normalized)) {
  // Assume already includes country code if >10 digits
  parsed = parsePhoneNumberFromString(`+${normalized}`);
}

// 3️⃣ If still invalid → reject
if (!parsed || !parsed.isValid()) {
  return res.status(400).json({ message: "Please enter a valid phone number in international format" });
}

// ✅ Store strictly in E.164 format (+CountryCode + Number)
phoneNumber = parsed.number;



    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists)
      return res.status(400).json({ message: 'User already exists' });

    // Email normalization and validation
    const normalizedEmail = email?.trim().toLowerCase() || undefined;
    if (normalizedEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(normalizedEmail))
        return res.status(400).json({ message: 'Invalid email format' });
      const emailExists = await User.findOne({ email: normalizedEmail });
      if (emailExists)
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phoneNumber,
      password,
      language: language || 'en',
    });

    const safeDeviceInfo = deviceInfo || {
      accessMode: 'website',
      deviceType: 'unknown',
      deviceModel: 'unknown',
      platform: 'unknown',
      browser: { name: 'unknown', version: 'unknown', osName: 'unknown', osVersion: 'unknown' },
    };

    setImmediate(() => {
      logAuthEvent({
        registerId: user.registerId,
        name: user.name,
        action: 'signup',
        deviceInfo: safeDeviceInfo,
      });
    });

    logActivity(
      { user: { registerId: user.registerId, name: user.name } },
      'CREATE',
      'User',
      user.registerId,
      { before: null, after: { name: user.name, email: user.email, phoneNumber: user.phoneNumber } },
      `User ${user.name} signed up`
    );

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '365d',
    });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        registerId: user.registerId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        category: user.category,
        language: user.language,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
export const signIn = async (req, res) => {
  try {
    let { identifier, password, language, deviceInfo } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    let isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    // 🔹 Normalize email if applicable
    if (isEmail) {
      identifier = identifier.trim().toLowerCase();
    } else {
      // 🔹 Normalize phone number to E.164 format (same logic as signup)
      let phone = identifier.trim().replace(/^00/, "+").replace(/[\s-]+/g, "");
      let parsed;

      if (phone.startsWith("+")) {
        parsed = parsePhoneNumberFromString(phone);
      } else if (/^\d{6,15}$/.test(phone)) {
        parsed = parsePhoneNumberFromString(`+${phone}`);
      }

      if (parsed && parsed.isValid()) {
        identifier = parsed.number; // ✅ final normalized phone number
      } else {
        return res.status(400).json({ message: "Invalid phone number" });
      }
    }

    // 🔍 Lookup by email or normalized phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }],
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Device logging
    const safeDeviceInfo = deviceInfo || {
      accessMode: "website",
      deviceType: "unknown",
      deviceModel: "unknown",
      platform: "unknown",
      browser: { name: "unknown", version: "unknown", osName: "unknown", osVersion: "unknown" },
    };

    setImmediate(() => {
      logAuthEvent({
        registerId: user.registerId,
        name: user.name,
        action: "signin",
        deviceInfo: safeDeviceInfo,
      });
    });

    logActivity(
      { user: { registerId: user.registerId, name: user.name } },
      "UPDATE",
      "User",
      user.registerId,
      { before: null, after: { deviceInfo: safeDeviceInfo } },
      `User ${user.name} signed in`
    );

    // ✅ Language update
    if (language && language !== user.language) {
      user.language = language;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    return res.json({
      token,
      user: {
        id: user._id,
        registerId: user.registerId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        category: user.category,
        language: user.language,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const rawEmail = req.body.email;
    if (!rawEmail) return res.status(400).json({ message: 'Email required' });

    const email = rawEmail.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email format' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, otp });

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) return res.status(500).json({ message: 'Failed to send OTP email' });

    return res.json({ message: 'OTP sent successfully' });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const rawEmail = req.body.email;
    const email = rawEmail.trim().toLowerCase();
    const otp = req.body.otp;

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });

    await OTP.deleteOne({ _id: otpRecord._id });

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });
    return res.json({ resetToken });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    const email = decoded.email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    await logActivity(
      { user: { registerId: user.registerId, name: user.name } },
      'UPDATE',
      'User',
      user.registerId,
      { before: null, after: null },
      `User ${user.name} reset password`
    );

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError')
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    return res.status(500).json({ message: 'Server error' });
  }
};
