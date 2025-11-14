import User from '../models/User.js';
import { logActivity } from '../middleware/activityLogger.js';
import { normalizePhoneNumber } from '../utils/phoneValidation.js';


export const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const matchStage = {};

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      matchStage.$or = [
        { registerId: searchRegex },
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { role: searchRegex },
        { category: searchRegex },
      ];
    }

    const pipeline = [
      Object.keys(matchStage).length ? { $match: matchStage } : null,
      {
        $addFields: {
          registerNumeric: {
            $let: {
              vars: {
                digits: {
                  $regexFind: { input: '$registerId', regex: /\d+/ },
                },
              },
              in: {
                $toInt: {
                  $ifNull: ['$$digits.match', 0],
                },
              },
            },
          },
        },
      },
      { $sort: { registerNumeric: 1, registerId: 1 } },
      {
        $lookup: {
          from: 'notifications',
          let: { regId: '$registerId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$registerId', '$$regId'] } } },
            {
              $project: {
                _id: 0,
                hasSubscriptions: {
                  $gt: [{ $size: { $ifNull: ['$subscriptions', []] } }, 0],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'notificationMeta',
        },
      },
      {
        $addFields: {
          notificationsEnabled: {
            $ifNull: [{ $arrayElemAt: ['$notificationMeta.hasSubscriptions', 0] }, false],
          },
        },
      },
      {
        $project: {
          _id: 0,
          registerId: 1,
          name: 1,
          email: 1,
          phoneNumber: 1,
          role: 1,
          category: 1,
          profileImage: 1,
          language: 1,
          createdAt: 1,
          notificationsEnabled: 1,
        },
      },
    ].filter(Boolean);

    const users = await User.aggregate(pipeline).exec();
    res.json(users);
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateUserCategory = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const userToUpdate = await User.findById(userId).select('email category registerId');
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    if (userToUpdate.email === 'gangavaramnbkyouth@gmail.com') {
      return res.status(403).json({ message: 'Cannot change default developer category' });
    }

    const originalCategory = userToUpdate.category;
    userToUpdate.category = req.body.category;
    await userToUpdate.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      userToUpdate.registerId,
      { before: { category: originalCategory }, after: { category: userToUpdate.category } },
      `Category updated by ${req.user.name}`,
    );

    res.json(userToUpdate);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateUserRole = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const userToUpdate = await User.findById(userId).select('email role registerId');
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    const requester = req.user;
    const newRole = req.body.role;

    if (userToUpdate.email === 'gangavaramnbkyouth@gmail.com') {
      return res.status(403).json({ message: 'Cannot change default developer role' });
    }

    if (requester.role === 'admin' && ['financier', 'developer'].includes(userToUpdate.role)) {
      return res.status(403).json({ message: 'Admins cannot change Financier or Developer roles' });
    }

    if (requester.role === 'financier' && userToUpdate.role === 'developer') {
      return res.status(403).json({ message: 'Financiers cannot change Developer roles' });
    }

    if (requester.role === 'admin' && !['user', 'admin'].includes(newRole)) {
      return res.status(403).json({ message: 'Admins can only assign User or Admin roles' });
    }

    if (requester.role === 'financier' && !['user', 'admin', 'financier'].includes(newRole)) {
      return res.status(403).json({ message: 'Financiers can only assign User, Admin, or Financier roles' });
    }

    const originalRole = userToUpdate.role;
    userToUpdate.role = newRole;
    await userToUpdate.save();

    await logActivity(
      req,
      'UPDATE',
      'User',
      userToUpdate.registerId,
      { before: { role: originalRole }, after: { role: newRole } },
      `Role changed by ${requester.name}`,
    );

    res.json(userToUpdate);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateUserProfile = async (req, res) => {
  try {
    let { name, email, phoneNumber } = req.body;

    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const userToUpdate = await User.findById(userId).select('name email phoneNumber registerId');
    if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

    const normalizedEmail = email?.trim().toLowerCase();

    if (
      userToUpdate.email === 'gangavaramnbkyouth@gmail.com' &&
      normalizedEmail !== userToUpdate.email
    ) {
      return res.status(403).json({ message: 'Cannot change default developer email' });
    }

    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail))
        return res.status(400).json({ message: 'Invalid email format' });

      if (normalizedEmail !== userToUpdate.email) {
        const exists = await User.findOne({ email: normalizedEmail }).select('_id').lean();
        if (exists) return res.status(400).json({ message: 'Email already in use' });
      }
    }

    if (phoneNumber && phoneNumber.trim()) {
      phoneNumber = normalizePhoneNumber(phoneNumber);
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Please enter a valid phone number in international format' });
      }

      if (phoneNumber !== userToUpdate.phoneNumber) {
        const exists = await User.findOne({ phoneNumber }).select('_id').lean();
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
      `Profile updated by ${req.user.name}`,
    );

    res.json(userToUpdate);
  } catch (err) {
    console.error('updateUserProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const userToDelete = await User.findById(userId).select(
      'email registerId name phoneNumber role category profileImage',
    );
    if (!userToDelete) return res.status(404).json({ message: 'User not found' });

    if (userToDelete.email === 'gangavaramnbkyouth@gmail.com') {
      return res.status(403).json({ message: 'Cannot delete default developer account' });
    }

    const original = userToDelete.toObject();

    await User.findByIdAndDelete(userId);

    await logActivity(
      req,
      'DELETE',
      'User',
      userToDelete.registerId,
      { before: original, after: null },
      `User deleted by ${req.user.name}`,
    );

    res.json({ message: 'User deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
