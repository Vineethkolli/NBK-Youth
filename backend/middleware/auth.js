import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { Access } from '../config/access.js';

// Authenticate the user using JWT
export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!decoded.sid) {
      return res.status(401).json({ message: 'Session missing or expired' });
    }

    let session = null;
    if (decoded.sid) {
      session = await Session.findById(decoded.sid);
      const sessionMismatch =
        !session ||
        !session.isValid ||
        session.userId.toString() !== user._id.toString();

      if (sessionMismatch || session.expiresAt < new Date()) {
        if (session && session.expiresAt < new Date()) {
          session.isValid = false;
          await session.save().catch(() => {});
        }
        return res.status(401).json({ message: 'Session expired. Please sign in again.' });
      }
    }

    req.user = user;
    req.authSession = session;
    next();
  } catch (error) {
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
