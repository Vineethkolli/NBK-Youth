
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { updateProfileImage, deleteProfileImage, getAllUsers, updateProfile, updateUserCategory, deleteUser, updateUserRole, getProfile, updateLanguage } from '../controllers/usersController.js';

const router = express.Router();

// User routes
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);
router.patch('/language', auth, updateLanguage);
router.post('/profile/image', auth, updateProfileImage);
router.delete('/profile/image', auth, deleteProfileImage);

// Admin, Developer routes
router.get('/', auth, checkRole(['developer', 'financier', 'admin']), getAllUsers);
router.patch('/:userId/category', auth, checkRole(['developer']), updateUserCategory);
router.delete('/:userId', auth, checkRole(['developer']), deleteUser);
router.patch('/:userId/role', auth, checkRole(['developer']), updateUserRole);

export default router;
