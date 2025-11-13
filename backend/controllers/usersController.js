import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../middleware/activityLogger.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { registerId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const users = await User.find(query).select('-password').sort({ registerId: 1 }).lean();

    // Batch fetch all notifications in a single query to avoid N+1 problem
    const registerIds = users.map(u => u.registerId);
    const notifications = await Notification.find({
      registerId: { $in: registerIds }
    }).lean();

    const notificationMap = new Map();
    notifications.forEach(notif => {
      const existing = notificationMap.get(notif.registerId) || false;
      const hasSubscription = notif.subscriptions?.length > 0;

      notificationMap.set(notif.registerId, existing || hasSubscription);
    });
   
    // Merge user data with notification status
    const usersWithNotifications = users.map(user => ({
      ...user,
      notificationsEnabled: notificationMap.get(user.registerId) === true
    }));

    res.json(usersWithNotifications);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateUserCategory = async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.userId);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    if (userToUpdate.email === 'gangavaramnbkyouth@gmail.com')
      return res.status(403).json({ message: 'Cannot change default developer category' });

    const originalCategory = userToUpdate.category;
    userToUpdate.category = req.body.category;
    await userToUpdate.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      userToUpdate.registerId,
      { before: { category: originalCategory }, after: { category: userToUpdate.category } },
      `Category updated by ${req.user.name}`
    );

    res.json(userToUpdate);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateUserRole = async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.userId);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    const requester = req.user;
    const newRole = req.body.role;

    if (userToUpdate.email === 'gangavaramnbkyouth@gmail.com')
      return res.status(403).json({ message: 'Cannot change default developer role' });

    if (requester.role === 'admin' && ['financier', 'developer'].includes(userToUpdate.role))
      return res.status(403).json({ message: 'Admins cannot change Financier or Developer roles' });

    if (requester.role === 'financier' && userToUpdate.role === 'developer')
      return res.status(403).json({ message: 'Financiers cannot change Developer roles' });

    if (requester.role === 'admin' && !['user', 'admin'].includes(newRole))
      return res.status(403).json({ message: 'Admins can only assign User or Admin roles' });

    if (requester.role === 'financier' && !['user', 'admin', 'financier'].includes(newRole))
      return res.status(403).json({ message: 'Financiers can only assign User, Admin, or Financier roles' });

    const originalRole = userToUpdate.role;
    userToUpdate.role = newRole;
    await userToUpdate.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      userToUpdate.registerId,
      { before: { role: originalRole }, after: { role: newRole } },
      `Role changed by ${requester.name}`
    );

    res.json(userToUpdate);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateUserProfile = async (req, res) => {
  try {
    let { name, email, phoneNumber } = req.body;
    const userToUpdate = await User.findById(req.params.userId);
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    const normalizedEmail = email?.trim().toLowerCase();

    // Prevent changing developer email
    if (
      userToUpdate.email === 'gangavaramnbkyouth@gmail.com' &&
      normalizedEmail !== userToUpdate.email
    ) {
      return res.status(403).json({ message: 'Cannot change default developer email' });
    }

    // Email validation
    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail))
        return res.status(400).json({ message: 'Invalid email format' });

      if (normalizedEmail !== userToUpdate.email) {
        const exists = await User.findOne({ email: normalizedEmail }).lean();
        if (exists) return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Phone normalization and validation (E.164)
    if (phoneNumber && phoneNumber.trim()) {
      let normalized = phoneNumber.trim().replace(/^00/, '+').replace(/[\s-]+/g, '');
      let parsed;

      if (normalized.startsWith('+')) {
        parsed = parsePhoneNumberFromString(normalized);
      } else if (/^\d{6,15}$/.test(normalized)) {
        parsed = parsePhoneNumberFromString(`+${normalized}`);
      }

      if (!parsed || !parsed.isValid()) {
        return res
          .status(400)
          .json({ message: 'Please enter a valid phone number in international format' });
      }

      phoneNumber = parsed.number; 

      if (phoneNumber !== userToUpdate.phoneNumber) {
        const exists = await User.findOne({ phoneNumber }).lean();
        if (exists) return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    const original = {
      name: userToUpdate.name,
      email: userToUpdate.email,
      phoneNumber: userToUpdate.phoneNumber,
    };

    userToUpdate.name = name || userToUpdate.name;
    userToUpdate.email = normalizedEmail || userToUpdate.email;
    userToUpdate.phoneNumber = phoneNumber || userToUpdate.phoneNumber;
    await userToUpdate.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      userToUpdate.registerId,
      { before: original, after: { name, email, phoneNumber } },
      `Profile updated by ${req.user.name}`
    );

    res.json(userToUpdate);
  } catch (err) {
    console.error('updateUserProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.userId);
    if (!userToDelete) return res.status(404).json({ message: 'User not found' });
    if (userToDelete.email === 'gangavaramnbkyouth@gmail.com')
      return res.status(403).json({ message: 'Cannot delete default developer account' });

    const original = userToDelete.toObject();
    await User.findByIdAndDelete(req.params.userId);

    await logActivity(
      req,
      'DELETE',
      'User',
      userToDelete.registerId,
      { before: original, after: null },
      `User deleted by ${req.user.name}`
    );

    res.json({ message: 'User deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
