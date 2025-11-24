import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Session from "../models/Session.js";
import OTP from "../models/OTP.js";
import { sendOTPEmail } from "../services/emailOTPService.js";
import { logActivity } from "../middleware/activityLogger.js";
import AuthLog from "../models/AuthLog.js";
import { sendSignupEmail } from "../services/SignupEmail.js";
import { normalizePhoneNumber } from "../utils/phoneValidation.js";
import admin from "../utils/firebaseAdmin.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Token generation utilities
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // 1 day
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 12 months
    path: '/'
  });
};

const logAuthEvent = async (data) => {
  try {
    setImmediate(async () => {
      await AuthLog.create(data);
    });
  } catch (error) {
    console.error("Auth log failed:", error.message);
  }
};

// User Response Formatter
const createAuthResponse = (user) => ({
  id: user._id,
  registerId: user.registerId,
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  category: user.category,
  language: user.language,
  profileImage: user.profileImage,
  hasPassword: !!user.password,
  googleId: user.googleId || null,
});


export const checkSignupInfo = async (req, res) => {
  try {
    let { name, email, phoneNumber } = req.body;

    if (!name || !phoneNumber)
      return res.status(400).json({ message: "Name & phone number are required" });

    phoneNumber = normalizePhoneNumber(phoneNumber);
    if (!phoneNumber)
      return res.status(400).json({ message: "Please enter a valid phone number" });

    const normalizedEmail = email?.trim().toLowerCase() || undefined;
    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail))
        return res.status(400).json({ message: "Invalid email format" });
    }

    const [phoneExists, emailExists] = await Promise.all([
      User.findOne({ phoneNumber }).select("_id").lean(),
      normalizedEmail ? User.findOne({ email: normalizedEmail }).select("_id").lean() : null,
    ]);

    if (phoneExists)
      return res.status(400).json({ message: "Phone number already registered" });

    if (emailExists)
      return res.status(400).json({ message: "Email already registered" });

    if (!normalizedEmail) {
      return res.json({
        sendOtp: false
      });
    }

    await OTP.deleteMany({ email: normalizedEmail });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email: normalizedEmail, otp });

    const emailSent = await sendOTPEmail(normalizedEmail, otp, "verify_email");

    if (!emailSent)
      return res.status(500).json({ message: "Failed to send verification OTP" });

    res.json({
      message: "OTP sent to email",
      sendOtp: true
    });
  } catch (error) {
    console.error("Check signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const signUp = async (req, res) => {
  try {
    let { name, email, phoneNumber, password, language, deviceInfo } = req.body;

    if (!name || !phoneNumber || !password)
      return res.status(400).json({ message: "Required fields missing" });

    phoneNumber = normalizePhoneNumber(phoneNumber);
    if (!phoneNumber)
      return res
        .status(400)
        .json({ message: "Please enter a valid phone number" });

    const normalizedEmail = email?.trim().toLowerCase() || undefined;
    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail))
        return res.status(400).json({ message: "Invalid email format" });
    }

    const [phoneExists, emailExists] = await Promise.all([
      User.findOne({ phoneNumber }).select("_id").lean(),
      normalizedEmail
        ? User.findOne({ email: normalizedEmail }).select("_id").lean()
        : null,
    ]);

    if (phoneExists)
      return res.status(400).json({ message: "Phone number already registered" });
    if (emailExists)
      return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({
      name,
      email: normalizedEmail,
      phoneNumber,
      password,
      language: language || "en",
    });

    logAuthEvent({
      registerId: user.registerId,
      name: user.name,
      action: "signup",
      deviceInfo,
    });

    logActivity(
      { user: { registerId: user.registerId, name: user.name } },
      "CREATE",
      "User",
      user.registerId,
      {
        before: null,
        after: {
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
      },
      `User ${user.name} signed up`
    );

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();

    // Create session
    await Session.createSession(user._id, refreshToken, deviceInfo);

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    if (user.email) sendSignupEmail(user.email, user.name);

    res.status(201).json({
      accessToken,
      user: createAuthResponse(user),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const signIn = async (req, res) => {
  try {
    let { identifier, password, language, deviceInfo } = req.body;

    if (!identifier || !password)
      return res.status(400).json({ message: "Required fields missing" });

    let query = {};
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    if (isEmail) {
      query.email = identifier.trim().toLowerCase();
    } else {
      const phone = normalizePhoneNumber(identifier);
      if (!phone)
        return res.status(400).json({ message: "Invalid phone number" });
      query.phoneNumber = phone;
    }

    const user = await User.findOne(query);
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.password)
      return res
        .status(400)
        .json({ message: "This account uses Google Sign-In" });

    const valid = await user.comparePassword(password);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials" });

    // Password has from 12 to 10 rounds
    const currentRounds = user.getHashRounds();
    if (currentRounds !== 10) {
      user.password = password;
      await user.save();
    }

    logAuthEvent({
      registerId: user.registerId,
      name: user.name,
      action: "signin",
      deviceInfo,
    });

    logActivity(
      { user: { registerId: user.registerId, name: user.name } },
      "UPDATE",
      "User",
      user.registerId,
      { before: null, after: { deviceInfo } },
      `User ${user.name} signed in`
    );

    if (language && language !== user.language) {
      user.language = language;
      await user.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();

    // Create session
    await Session.createSession(user._id, refreshToken, deviceInfo);

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      accessToken,
      user: createAuthResponse(user),
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const googleAuth = async (req, res) => {
  const { credential, accessToken, phoneNumber, name: customName, language, deviceInfo } = req.body;

  if (!credential && !accessToken)
    return res.status(400).json({ message: "Google credential or access token required" });

  try {
    let name, email, googleId, picture;

    if (credential) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub)
        return res.status(401).json({ message: "Invalid Google token" });

      name = payload.name;
      email = payload.email;
      googleId = payload.sub;
      picture = payload.picture;
    } else if (accessToken) {
      const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!data || !data.email || !data.sub)
        return res.status(401).json({ message: "Invalid Google access token" });

      name = data.name;
      email = data.email;
      googleId = data.sub;
      picture = data.picture;
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      logAuthEvent({
        registerId: user.registerId,
        name: user.name,
        action: "signin-google",
        deviceInfo,
      });

      // Generate tokens
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken();

      // Create session
      await Session.createSession(user._id, refreshToken, deviceInfo);

      // Set refresh token cookie
      setRefreshTokenCookie(res, refreshToken);

      return res.json({
        status: "success",
        accessToken,
        user: createAuthResponse(user),
      });
    }

    if (!phoneNumber)
      return res.status(400).json({
        message: "Phone number required for new Google users",
        googleUser: { name, email, picture },
      });

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone)
      return res.status(400).json({ message: "Invalid phone number" });

    const phoneExists = await User.findOne({ phoneNumber: normalizedPhone });
    if (phoneExists)
      return res
        .status(400)
        .json({ message: "Phone number already registered" });

    const finalName = customName || name;
    if (!finalName)
      return res.status(400).json({ message: "Name is required" });

    user = await User.create({
      name: finalName,
      email: normalizedEmail,
      googleId,
      phoneNumber: normalizedPhone,
      password: null,
      profileImage: picture || null,
      language: language || "en",
      role: "user",
      category: "general",
    });

    logAuthEvent({
      registerId: user.registerId,
      name: user.name,
      action: "signup-google",
      deviceInfo,
    });

    logActivity(
      { user: { registerId: user.registerId, name: user.name } },
      "CREATE",
      "User",
      user.registerId,
      {
        before: null,
        after: {
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
      },
      `User ${user.name} signed up via Google`
    );

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();

    // Create session
    await Session.createSession(user._id, refreshToken, deviceInfo);

    // Set refresh token cookie
    setRefreshTokenCookie(res, refreshToken);

    if (user.email) sendSignupEmail(user.email, user.name);

    res.status(201).json({
      status: "success",
      accessToken,
      user: createAuthResponse(user),
    });
  } catch (error) {
    console.error("Google signup error:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const rawEmail = req.body.email;
    if (!rawEmail) return res.status(400).json({ message: 'Email required' });

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email))
      return res.status(400).json({ message: 'Invalid email format' });

    const user = await User.findOne({ email }).select('_id email').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    await OTP.deleteMany({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.create({ email, otp });

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) return res.status(500).json({ message: 'Failed to send OTP email' });

    return res.json({ message: 'OTP sent successfully' });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};


export const initiatePhonePasswordReset = async (req, res) => {
  try {
    const normalizedPhone = normalizePhoneNumber(req.body.phoneNumber);
    if (!normalizedPhone)
      return res.status(400).json({ message: 'Please enter a valid phone number' });

    const user = await User.findOne({ phoneNumber: normalizedPhone }).select('_id').lean();
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    return res.json({ message: 'Phone number verified' });
  } catch (error) {
    console.error('Phone reset initiation error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


export const issuePhoneResetToken = async (req, res) => {
  try {
    const { phoneNumber, firebaseToken } = req.body;

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone)
      return res.status(400).json({ message: 'Please enter a valid phone number' });

    if (!firebaseToken)
      return res.status(401).json({ message: 'OTP verification required' });

    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    if (!decoded.phone_number || normalizePhoneNumber(decoded.phone_number) !== normalizedPhone) {
      return res.status(401).json({ message: 'OTP verification mismatch' });
    }

    const user = await User.findOne({ phoneNumber: normalizedPhone }).select('_id').lean();
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const resetToken = jwt.sign(
      { phoneNumber: normalizedPhone },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({ resetToken });
  } catch (error) {
    console.error('Phone reset token error:', error);
    return res.status(401).json({ message: 'Invalid Firebase token' });
  }
};


export const verifyOtp = async (req, res) => {
  try {
    const { email: rawEmail, otp: rawOtp } = req.body;

    if (!rawEmail || typeof rawEmail !== 'string')
      return res.status(400).json({ message: 'Email is required' });

    if (!rawOtp || typeof rawOtp !== 'string')
      return res.status(400).json({ message: 'OTP is required' });

    const email = rawEmail.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const otp = rawOtp.trim();
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    const otpRecord = await OTP.findOneAndDelete({ email, otp });
    if (!otpRecord)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    const otpAge = Date.now() - otpRecord.createdAt.getTime();
    const TEN_MINUTES = 10 * 60 * 1000;
    if (otpAge > TEN_MINUTES) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({ resetToken });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    let user;

    if (decoded.email) {
      const email = decoded.email.trim().toLowerCase();
      user = await User.findOne({ email });
    } else if (decoded.phoneNumber) {
      const phoneNumber = normalizePhoneNumber(decoded.phoneNumber);
      if (!phoneNumber)
        return res.status(400).json({ message: 'Invalid reset token payload' });

      user = await User.findOne({ phoneNumber });
    } else {
      return res.status(400).json({ message: 'Invalid reset token payload' });
    }

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

// Refresh access token
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Find session by refresh token
    const session = await Session.findByToken(refreshToken);

    if (!session) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await session.deleteOne();
      return res.status(401).json({ message: 'Session expired' });
    }

    // Get user
    const user = await User.findById(session.userId).select('-password');
    if (!user) {
      await session.deleteOne();
      return res.status(404).json({ message: 'User not found' });
    }

    // Update session last used time and extend expiry (sliding window)
    await session.updateLastUsed();

    // Generate new access token
    const accessToken = generateAccessToken(user._id, user.role);

    res.json({
      accessToken,
      user: createAuthResponse(user),
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Logout from current device
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Delete the session for this device
      await Session.deleteOne({ refreshTokenHash: Session.hashToken(refreshToken) });
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all active sessions for the logged-in user
export const getSessions = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({ userId })
      .sort({ lastUsedAt: -1 })
      .select('deviceInfo createdAt lastUsedAt expiresAt refreshTokenHash')
      .lean();

    // Add current session indicator
    const { refreshToken } = req.cookies;
    let currentSessionHash = null;
    if (refreshToken) {
      currentSessionHash = Session.hashToken(refreshToken);
    }

    const sessionsWithCurrent = sessions.map(session => ({
      id: session._id,
      deviceInfo: session.deviceInfo,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      isCurrent: currentSessionHash === session.refreshTokenHash
    }));

    res.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete a specific session (logout from a device)
export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    // Find and delete session, ensuring it belongs to the user
    const session = await Session.findOneAndDelete({
      _id: sessionId,
      userId
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // If deleting current session, clear cookie
    const { refreshToken } = req.cookies;
    if (refreshToken && Session.hashToken(refreshToken) === session.refreshTokenHash) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
      });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
