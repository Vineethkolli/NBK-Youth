import User from '../models/User.js';
import Session from '../models/Session.js';
import { Access } from '../config/access.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';

// Authenticate the user using JWT
export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = verifyAccessToken(token);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // If token is bound to a session, ensure the session is still valid
    if (decoded.sessionId) {
      const session = await Session.findOne({
        _id: decoded.sessionId,
        isValid: true,
        expiresAt: { $gt: new Date() }
      }).select('_id userId');

      if (!session) {
        return res.status(401).json({ message: 'Session invalid', expired: true });
      }

      if (String(session.userId) !== String(decoded.id)) {
        return res.status(401).json({ message: 'Session-user mismatch', expired: true });
      }

      req.sessionId = decoded.sessionId;
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    req.tokenIssuedAt = decoded.iat;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', expired: true });
    }
    res.status(401).json({ message: 'Invalid token', expired: false });
  }
};


// Role-based access control
export const checkRole = (allowed) => (req, res, next) => {
  if (allowed === 0 || allowed === 'All') return next();
  
  const allowedRoles = Array.isArray(allowed)
    ? allowed
    : Access[allowed] || [];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};
