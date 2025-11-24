import axios from "axios";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { sendOTPEmail } from "../services/emailOTPService.js";
import { logActivity } from "../middleware/activityLogger.js";
import AuthLog from "../models/AuthLog.js";
import { sendSignupEmail } from "../services/SignupEmail.js";
import { normalizePhoneNumber } from "../utils/phoneValidation.js";
import admin from "../utils/firebaseAdmin.js";
import Session from "../models/Session.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

const REFRESH_COOKIE_NAME = "nbk_refresh";
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 year rolling expiry
const ACCESS_TOKEN_TTL = "48h";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: REFRESH_TOKEN_TTL_MS,
  path: "/",
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateAccessToken = (userId, role, sessionId) =>
  jwt.sign({ id: userId, role, sid: sessionId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const generateRefreshToken = () => crypto.randomBytes(64).toString("hex");

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, cookieOptions);
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
};

const getRefreshTokenFromRequest = (req) => req.cookies?.[REFRESH_COOKIE_NAME];

const sanitizeSnippet = (value) =>
  typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, 80)
    : undefined;

const buildDeviceSnapshot = (details = {}) => {
  if (!details || typeof details !== "object") {
    return {
      device: "unknown",
      os: "unknown",
      browser: "unknown",
      accessMode: "unknown",
    };
  }

  const deviceParts = [details.deviceType, details.deviceModel]
    .map(sanitizeSnippet)
    .filter(Boolean);
  const osParts = [
    details.browser?.osName || details.platform,
    details.browser?.osVersion,
  ]
    .map(sanitizeSnippet)
    .filter(Boolean);
  const browserParts = [details.browser?.name, details.browser?.version]
    .map(sanitizeSnippet)
    .filter(Boolean);

  return {
    device: deviceParts.join(" ") || "unknown",
    os: osParts.join(" ") || "unknown",
    browser: browserParts.join(" ") || "unknown",
    accessMode: sanitizeSnippet(details.accessMode) || "unknown",
  };
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  if (req.ip) return req.ip.replace("::ffff:", "");
  return (
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers["x-real-ip"] ||
    ""
  );
};

const isPublicIp = (ip = "") => {
  if (!ip) return false;
  const normalized = ip.replace("::ffff:", "");
  if (normalized === "127.0.0.1" || normalized === "::1") return false;
  if (normalized.startsWith("10.")) return false;
  if (normalized.startsWith("192.168.")) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return false;
  return true;
};

const fetchIpLocation = async (ip) => {
  if (!isPublicIp(ip)) return { state: "unknown", country: "unknown" };
  try {
    const { data } = await axios.get(`https://ipwhois.io/json/${ip}`, {
      timeout: 3000,
    });
    return {
      state: data.region || data.state || "unknown",
      country: data.country || data.country_code || "unknown",
    };
  } catch (error) {
    console.warn("IP lookup failed", error.message);
    return { state: "unknown", country: "unknown" };
  }
};

const createSession = async (user, req) => {
  const now = new Date();
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const deviceInfo = buildDeviceSnapshot(req.body?.deviceInfo || {});
  const ipAddress = getClientIp(req);
  const location = await fetchIpLocation(ipAddress);

  const session = await Session.create({
    userId: user._id,
    tokenHash,
    lastActive: now,
    expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
    deviceInfo,
    location,
    ipAddress: ipAddress || null,
    isValid: true,
  });

  return { session, refreshToken };
};

const touchSession = (session) => {
  const now = new Date();
  session.lastActive = now;
  session.expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
};

const invalidateSession = async (session) => {
  if (!session) return;
  session.isValid = false;
  session.tokenHash = hashToken(generateRefreshToken());
  session.expiresAt = new Date();
  session.lastActive = new Date();
  await session.save().catch(() => {});
};

const sendAuthSuccess = async ({ user, req, res, statusCode = 200, extra = {} }) => {
  const { session, refreshToken } = await createSession(user, req);
  const accessToken = generateAccessToken(user._id, user.role, session._id);
  setRefreshCookie(res, refreshToken);

  return res.status(statusCode).json({
    ...extra,
    accessToken,
    token: accessToken,
    sessionId: session._id,
    sessionExpiresAt: session.expiresAt,
    user: createAuthResponse(user),
  });
};


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

    if (user.email) sendSignupEmail(user.email, user.name);

    return sendAuthSuccess({ user, req, res, statusCode: 201 });
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

    return sendAuthSuccess({ user, req, res });
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

      return sendAuthSuccess({
        user,
        req,
        res,
        extra: { status: "success" },
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

    if (user.email) sendSignupEmail(user.email, user.name);

    return sendAuthSuccess({
      user,
      req,
      res,
      statusCode: 201,
      extra: { status: "success" },
    });
  } catch (error) {
    console.error("Google signup error:", error);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};

export const refreshSession = async (req, res) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    const session = await Session.findOne({
      tokenHash: hashToken(refreshToken),
      isValid: true,
    });

    if (!session || session.expiresAt < new Date()) {
      await invalidateSession(session);
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Session expired" });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      await invalidateSession(session);
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Session expired" });
    }

    const newRefreshToken = generateRefreshToken();
    session.tokenHash = hashToken(newRefreshToken);
    touchSession(session);
    await session.save();

    const accessToken = generateAccessToken(user._id, user.role, session._id);
    setRefreshCookie(res, newRefreshToken);

    return res.json({ accessToken, token: accessToken, sessionId: session._id });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Failed to refresh session" });
  }
};

export const pingSession = async (req, res) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      return res.status(401).json({ ok: false });
    }

    const session = await Session.findOne({
      tokenHash: hashToken(refreshToken),
      isValid: true,
    });

    if (!session || session.expiresAt < new Date()) {
      await invalidateSession(session);
      clearRefreshCookie(res);
      return res.status(401).json({ ok: false });
    }

    touchSession(session);
    await session.save();

    return res.json({ ok: true });
  } catch (error) {
    console.error("Ping error:", error);
    return res.status(500).json({ message: "Failed to update last active" });
  }
};

export const logout = async (req, res) => {
  try {
    let session = req.authSession;

    if (!session) {
      const refreshToken = getRefreshTokenFromRequest(req);
      if (refreshToken) {
        session = await Session.findOne({
          tokenHash: hashToken(refreshToken),
          userId: req.user?._id,
        });
      }
    }

    if (session) {
      await invalidateSession(session);
    }

    clearRefreshCookie(res);
    return res.json({ message: "Signed out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Failed to sign out" });
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
