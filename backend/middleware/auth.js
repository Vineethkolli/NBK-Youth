import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { Access } from '../config/access.js';

// Authenticate the user using JWT
export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
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
