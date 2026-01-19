import Session from "../models/Session.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/tokenUtils.js";
import { getLocationFromIP } from "../utils/ipLocation.js";

const getIsHttps = (req) =>
  req.secure || (process.env.FRONTEND_URL || "").startsWith("https://");

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

    const isHttps = getIsHttps(req);
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
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
      isCurrent: (currentTokenHash ? s.tokenHash === currentTokenHash : false) || String(s._id) === String(req.sessionId || '')
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

    // Prefer sessionId from auth middleware (access token), fallback to cookie-based lookup
    if (req.sessionId) {
      await Session.findOneAndUpdate({ _id: req.sessionId }, { isValid: false });
    } else if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await Session.findOneAndUpdate({ tokenHash }, { isValid: false });
    } else {
      return res.json({ message: "Already signed out" });
    }

    // Clear cookie if present
    const isHttps = getIsHttps(req);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax"
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
    const { search, isValid, action, sortOrder, timeFilter = 'sessions', page = 1, limit = 50 } = req.query;

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

    // Apply time filter based on lastActive
    if (timeFilter && timeFilter !== 'sessions') {
      // Get current time in IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
      const nowIST = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000));
      
      sessions = sessions.filter(session => {
        const lastActiveDate = new Date(session.lastActive);
        const lastActiveIST = new Date(lastActiveDate.getTime() + istOffset + (lastActiveDate.getTimezoneOffset() * 60 * 1000));
        
        if (timeFilter === 'today') {
          // Check if session was last active today in IST
          return lastActiveIST.toDateString() === nowIST.toDateString();
        } else if (timeFilter === 'monthly') {
          // Check if session was last active in current month in IST
          return lastActiveIST.getMonth() === nowIST.getMonth() && 
                 lastActiveIST.getFullYear() === nowIST.getFullYear();
        }
        return true;
      });
    }

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
        
        // Extract numeric part for proper numeric sorting
        const numA = parseInt(regIdA.replace(/\D/g, '')) || 0;
        const numB = parseInt(regIdB.replace(/\D/g, '')) || 0;
        
        if (sortOrder === 'asc') {
          return numA - numB;
        } else {
          return numB - numA;
        }
      });
    }

    const totalCount = sessions.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const totalPages = Math.ceil(totalCount / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedSessions = sessions.slice(startIndex, endIndex);

    res.json({
      sessions: paginatedSessions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Get all sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getSessionsStats = async (req, res) => {
  try {
    // Get start of today in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const nowIST = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000));
    
    const startOfTodayIST = new Date(nowIST);
    startOfTodayIST.setHours(0, 0, 0, 0);
    
    // Convert back to UTC for MongoDB query
    const startOfToday = new Date(startOfTodayIST.getTime() - istOffset - (startOfTodayIST.getTimezoneOffset() * 60 * 1000));

    const startOfMonth = new Date(startOfTodayIST.getFullYear(), startOfTodayIST.getMonth(), 1);
    startOfMonth.setHours(startOfMonth.getHours() - 5, startOfMonth.getMinutes() - 30);

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
