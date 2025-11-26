import Session from "../models/Session.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/tokenUtils.js";
import User from "../models/User.js";
import { getLocationFromIP } from "../utils/ipLocation.js";

export const createSessionAndTokens = async (user, deviceInfo, action, req) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;

  const locationPromise = getLocationFromIP(ip).catch(() => ({
    city: null,
    state: null,
    country: null
  }));

  const deviceInfoPromise = Promise.resolve({
    deviceType: deviceInfo?.deviceType || "unknown",
    deviceModel: deviceInfo?.deviceModel || "unknown",
    os: deviceInfo?.os || "unknown",
    browserName: deviceInfo?.browserName || "unknown",
    accessMode: deviceInfo?.accessMode || "website"
  });

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  const fifteenMonths = 365 * 24 * 60 * 60 * 1000;

  // Create session immediately (non-blocking placeholders for device info, location)
  const session = await Session.create({
    userId: user._id,
    tokenHash,
    deviceInfo: { deviceType: "unknown", deviceModel: "unknown", os: "unknown", browserName: "unknown" },
    location: { city: null, state: null, country: null },
    action,
    expiresAt: new Date(Date.now() + fifteenMonths)
  });

  Promise.all([deviceInfoPromise, locationPromise]).then(async ([dev, loc]) => {
    try {
      await Session.findByIdAndUpdate(session._id, {
        deviceInfo: dev,
        location: loc
      });
    } catch (err) {
      console.error("Failed to update session background:", err);
    }
  });

  return { accessToken, refreshToken };
};


export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token required" });

    const tokenHash = hashToken(refreshToken);

    const session = await Session.findOne({
      tokenHash,
      isValid: true,
      expiresAt: { $gt: new Date() }
    }).populate('userId', '-password');

    if (!session)
      return res.status(401).json({ message: "Invalid or expired session" });

    // Verify user still exists (handles user deletion)
    const user = session.userId;
    if (!user) {
      // User was deleted - invalidate session immediately
      await Session.findByIdAndUpdate(session._id, { isValid: false });
      return res.status(404).json({ message: "User not found" });
    }

    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);

    const fifteenMonths =  365 * 24 * 60 * 60 * 1000;

    session.tokenHash = newTokenHash;
    session.expiresAt = new Date(Date.now() + fifteenMonths);
    session.lastActive = new Date();
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: fifteenMonths
    });

    res.json({
      token: newAccessToken,
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
        hasPassword: !!user.password,
        googleId: user.googleId || null
      }
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const updateLastActive = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ ok: false });
    }

    const tokenHash = hashToken(refreshToken);

    await Session.findOneAndUpdate(
      { tokenHash, isValid: true },
      { lastActive: new Date() }
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("Update last active fatal error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getUserSessions = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const currentTokenHash = refreshToken ? hashToken(refreshToken) : null;

    const sessions = await Session.find({
      userId: req.user._id,
      isValid: true,
      expiresAt: { $gt: new Date() }
    })
      .select("_id deviceInfo location action createdAt lastActive tokenHash")
      .sort({ lastActive: -1 })
      .lean();

    const sessionsWithCurrent = sessions.map((s) => ({
      ...s,
      isCurrent: s.tokenHash === currentTokenHash
    }));

    res.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const signOutCurrent = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.json({ message: "Already signed out" });

    const tokenHash = hashToken(refreshToken);

    await Session.findOneAndUpdate({ tokenHash }, { isValid: false });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });

    res.json({ message: "Signed out successfully" });
  } catch (error) {
    console.error("Sign out error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const signOutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id
    });

    if (!session) return res.status(404).json({ message: "Session not found" });

    session.isValid = false;
    await session.save();

    res.json({ message: "Session signed out successfully" });
  } catch (error) {
    console.error("Sign out session error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllSessions = async (req, res) => {
  try {
    const { search, isValid, action, sortOrder } = req.query;

    // Build query
    let query = {};

    // Filter by validity
    if (isValid !== undefined && isValid !== '') {
      query.isValid = isValid === 'true';
    }

    // Filter by action
    if (action && action !== '') {
      query.action = action;
    }

    // Get sessions with user data populated
    let sessions = await Session.find(query)
      .populate('userId', 'registerId name')
      .sort({ createdAt: -1 })
      .lean();

    // Search functionality
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      sessions = sessions.filter(session => {
        const regId = session.userId?.registerId?.toLowerCase() || '';
        const name = session.userId?.name?.toLowerCase() || '';
        const actionText = session.action?.toLowerCase() || '';
        const accessMode = session.deviceInfo?.accessMode?.toLowerCase() || '';
        
        return regId.includes(searchLower) || 
               name.includes(searchLower) || 
               actionText.includes(searchLower) ||
               accessMode.includes(searchLower);
      });
    }

    // Sort by registerId
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      sessions.sort((a, b) => {
        const regIdA = a.userId?.registerId || '';
        const regIdB = b.userId?.registerId || '';
        
        if (sortOrder === 'asc') {
          return regIdA.localeCompare(regIdB);
        } else {
          return regIdB.localeCompare(regIdA);
        }
      });
    }

    res.json(sessions);
  } catch (error) {
    console.error("Get all sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
