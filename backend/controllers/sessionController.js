import Session from "../models/Session.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/tokenUtils.js";
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

  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);

  const fifteenMonths = 365 * 24 * 60 * 60 * 1000;

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

  const accessToken = generateAccessToken({ id: user._id, role: user.role, sessionId: session._id });

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

    const user = session.userId;
    if (!user) {
      await Session.findByIdAndUpdate(session._id, { isValid: false });
      return res.status(404).json({ message: "User not found" });
    }

    const newAccessToken = generateAccessToken({ id: user._id, role: user.role, sessionId: session._id });
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
    // Prefer the access-token-bound sessionId (set by auth middleware)
    const currentSessionId = req.sessionId ? String(req.sessionId) : null;
    // Fallback to refresh token cookie comparison if available
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
      isCurrent:
        (currentSessionId && String(s._id) === currentSessionId) ||
        (currentTokenHash && s.tokenHash === currentTokenHash) ||
        false,
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

    // Set isValid to false for the current session
    await Session.findOneAndUpdate(
      { tokenHash }, 
      { $set: { isValid: false } },
      { new: true }
    );

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

    let query = {};

    if (isValid !== undefined && isValid !== '') {
      query.isValid = isValid === 'true';
    }

    if (action && action !== '') {
      query.action = action;
    }

    let sessions = await Session.find(query)
      .populate('userId', 'registerId name')
      .sort({ createdAt: -1 })
      .lean();

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


export const getSessionsStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const activeSessionToday = Session.countDocuments({ lastActive: { $gte: startOfToday } });
    const activeSessionMonth = Session.countDocuments({ lastActive: { $gte: startOfMonth } });
    const activeSessionOverall = Session.countDocuments({});

    const activeUserToday = Session.distinct("userId", { lastActive: { $gte: startOfToday } });
    const activeUserMonth = Session.distinct("userId", { lastActive: { $gte: startOfMonth } });
    const activeUserOverall = Session.distinct("userId", {});

    const actionAgg = Session.aggregate([{ $group: { _id: '$action', count: { $sum: 1 } } }]);
    const accessModeAgg = Session.aggregate([{ $group: { _id: '$deviceInfo.accessMode', count: { $sum: 1 } } }]);

    const validTrue = Session.countDocuments({ isValid: true });
    const validFalse = Session.countDocuments({ isValid: false });

    const [
      _activeSessionToday,
      _activeSessionMonth,
      _activeSessionOverall,
      _activeUserToday,
      _activeUserMonth,
      _activeUserOverall,
      _actionAgg,
      _accessModeAgg,
      _validTrue,
      _validFalse
    ] = await Promise.all([
      activeSessionToday,
      activeSessionMonth,
      activeSessionOverall,
      activeUserToday,
      activeUserMonth,
      activeUserOverall,
      actionAgg,
      accessModeAgg,
      validTrue,
      validFalse
    ]);

    const actionCounts = {
      signin: 0,
      signup: 0,
      'google-signin': 0,
      'google-signup': 0
    };
    _actionAgg.forEach(a => { actionCounts[a._id] = a.count; });

    const accessModes = ['website','pwa','standalone','twa','addtohomescreen','unknown'];
    const accessModeCounts = accessModes.reduce((acc, m) => { acc[m] = 0; return acc; }, {});
    _accessModeAgg.forEach(m => { accessModeCounts[m._id || 'unknown'] = m.count; });

    res.json({
      actionCounts,
      validCounts: { validTrue: _validTrue, validFalse: _validFalse },
      accessModeCounts,

      activeSessions: {
        today: _activeSessionToday,
        month: _activeSessionMonth,
        overall: _activeSessionOverall
      },

      activeUsers: {
        today: _activeUserToday.length,
        month: _activeUserMonth.length,
        overall: _activeUserOverall.length
      }
    });
  } catch (error) {
    console.error('Get sessions stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
