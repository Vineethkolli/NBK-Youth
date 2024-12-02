import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get all users (developer only)
router.get('/', auth, checkRole(['developer']), async (req, res) => {
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
          { role: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent updating default developer email
    if (user.email === 'developer@gmail.com' && email !== 'developer@gmail.com') {
      return res.status(403).json({ message: 'Cannot change default developer email' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Check if phone number is already taken by another user
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (developer only)
router.delete('/:userId', auth, checkRole(['developer']), async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.userId);
    
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of default developer account
    if (userToDelete.email === 'developer@gmail.com') {
      return res.status(403).json({ message: 'Cannot delete default developer account' });
    }

    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (developer only)
router.patch('/:userId/role', auth, checkRole(['developer']), async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.userId);
    
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent role change for default developer account
    if (userToUpdate.email === 'developer@gmail.com') {
      return res.status(403).json({ message: 'Cannot change default developer role' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { role: req.body.role },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;