import axios from "axios";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import Session from "../models/Session.js";
import { sendOTPEmail } from "../services/emailOTPService.js";
import { logActivity } from "../middleware/activityLogger.js";
import { sendSignupEmail } from "../services/SignupEmail.js";
import { normalizePhoneNumber } from "../utils/phoneValidation.js";
import admin from "../utils/firebaseAdmin.js";
import { createSession, extendSessionExpiry } from "../services/sessionService.js";
import {
  clearRefreshCookie,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshCookie,
} from "../utils/tokenUtils.js";
import { getClientIp, lookupLocation } from "../utils/ipUtils.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const buildSessionContext = async (req) => {
  const ipAddress = getClientIp(req);
  let location = { city: "unknown", state: "unknown", country: "unknown" };

  try {
    location = await lookupLocation(ipAddress);
  } catch (error) {
    console.error("Location lookup failed", error.message);
  }

  return { ipAddress, location };
};

const issueAuthTokens = async ({ user, action, req, res, deviceInfo }) => {
  const safeDeviceInfo = deviceInfo || {};
  const { ipAddress, location } = await buildSessionContext(req);

  const refreshToken = generateRefreshToken();
  const session = await createSession({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    deviceInfo: safeDeviceInfo,
    location,
    ipAddress,
    action,
  });

  const accessToken = generateAccessToken(user._id, user.role, session._id.toString());
  setRefreshCookie(res, refreshToken);

  return { accessToken, sessionId: session._id };
};

const getSessionFromRefreshCookie = async (req) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken || typeof refreshToken !== "string") return null;

  const tokenHashValue = hashToken(refreshToken);
  const session = await Session.findOne({ tokenHash: tokenHashValue, isValid: true });
  if (!session) return null;

  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    session.isValid = false;
    await session.save();
    return null;
  }

  const user = await User.findById(session.userId);
  if (!user) {
    session.isValid = false;
    await session.save();
    return null;
  }

  return { refreshToken, session, user };
};

const sanitizeSession = (session, currentSessionId) => ({
  id: session._id,
  action: session.action,
  deviceInfo: session.deviceInfo,
  location: session.location,
  ipAddress: session.ipAddress,
  lastActive: session.lastActive,
  createdAt: session.createdAt,
  expiresAt: session.expiresAt,
  isValid: session.isValid,
  isCurrent: session._id.toString() === currentSessionId,
});

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

    if (user.email) sendSignupEmail(user.email, user.name);

    const { accessToken, sessionId } = await issueAuthTokens({
      user,
      action: "signup",
      req,
      res,
      deviceInfo,
    });

    res.status(201).json({
      token: accessToken,
      accessToken,
      sessionId,
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

    const { accessToken, sessionId } = await issueAuthTokens({
      user,
      action: "signin",
      req,
      res,
      deviceInfo,
    });

    res.json({
      token: accessToken,
      accessToken,
      sessionId,
      user: createAuthResponse(user),
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const googleAuth = async (req, res) => {
  const {
    credential,
    accessToken: googleAccessToken,
    phoneNumber,
    name: customName,
    language,
    deviceInfo,
  } = req.body;

  if (!credential && !googleAccessToken)
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
    } else if (googleAccessToken) {
      const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
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

      const { accessToken, sessionId } = await issueAuthTokens({
        user,
        action: "google-signin",
        req,
        res,
        deviceInfo,
      });

      return res.json({
        status: "success",
        token: accessToken,
        accessToken,
        sessionId,
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

    if (user.email) sendSignupEmail(user.email, user.name);

    const { accessToken, sessionId } = await issueAuthTokens({
      user,
      action: "google-signup",
      req,
      res,
      deviceInfo,
    });

    res.status(201).json({
      status: "success",
      token: accessToken,
      accessToken,
      sessionId,
      user: createAuthResponse(user),
    });
  } catch (error) {
    console.error("Google signup error:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};

export const refreshSession = async (req, res) => {
  try {
    const sessionData = await getSessionFromRefreshCookie(req);
    if (!sessionData) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Refresh token invalid" });
    }

    const { session, user } = sessionData;
    const newRefreshToken = generateRefreshToken();

    session.tokenHash = hashToken(newRefreshToken);
    session.lastActive = new Date();
    await extendSessionExpiry(session);

    setRefreshCookie(res, newRefreshToken);

    const accessToken = generateAccessToken(user._id, user.role, session._id.toString());
    return res.json({
      token: accessToken,
      accessToken,
      sessionId: session._id,
      user: createAuthResponse(user),
    });
  } catch (error) {
    console.error("Refresh session error:", error);
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Unable to refresh session" });
  }
};

export const updateLastActive = async (req, res) => {
  try {
    const sessionData = await getSessionFromRefreshCookie(req);
    if (!sessionData) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Session not found" });
    }

    sessionData.session.lastActive = new Date();
    await sessionData.session.save();

    return res.json({ ok: true });
  } catch (error) {
    console.error("Last active update error:", error);
    clearRefreshCookie(res);
    return res.status(500).json({ message: "Unable to update last active" });
  }
};

export const signOut = async (req, res) => {
  try {
    if (req.session) {
      req.session.isValid = false;
      await req.session.save();
    }

    clearRefreshCookie(res);
    return res.json({ message: "Signed out" });
  } catch (error) {
    console.error("Signout error:", error);
    return res.status(500).json({ message: "Unable to sign out" });
  }
};

export const listSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ lastActive: -1, createdAt: -1 })
      .lean();

    const currentSessionId = req.session?._id?.toString();
    const payload = sessions.map((session) => sanitizeSession(session, currentSessionId));

    return res.json({ sessions: payload });
  } catch (error) {
    console.error("List sessions error:", error);
    return res.status(500).json({ message: "Unable to fetch sessions" });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId)
      return res.status(400).json({ message: "Session id required" });

    const session = await Session.findOne({ _id: sessionId, userId: req.user._id });
    if (!session)
      return res.status(404).json({ message: "Session not found" });

    session.isValid = false;
    session.tokenHash = hashToken(generateRefreshToken()); // invalidate existing hash
    await session.save();

    if (req.session && req.session._id.toString() === sessionId) {
      clearRefreshCookie(res);
    }

    return res.json({ message: "Session revoked" });
  } catch (error) {
    console.error("Revoke session error:", error);
    return res.status(500).json({ message: "Unable to revoke session" });
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
