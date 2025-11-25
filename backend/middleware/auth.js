import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { Access } from '../config/access.js';
import { clearRefreshCookie } from '../utils/tokenUtils.js';

// Authenticate the user using JWT
export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!decoded.sid) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Session invalid' });
    }

    const session = await Session.findById(decoded.sid);
    if (!session || !session.isValid || session.userId.toString() !== user._id.toString()) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Session expired' });
    }

    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      session.isValid = false;
      await session.save();
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Session expired' });
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    clearRefreshCookie(res);
    res.status(401).json({ message: 'Invalid token' });
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
