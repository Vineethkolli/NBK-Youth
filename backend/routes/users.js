
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { updateProfileImage, deleteProfileImage, getAllUsers, updateProfile, updateUserCategory, deleteUser, updateUserRole, getProfile, updateLanguage } from '../controllers/usersController.js';
import multer from 'multer';

// Configure multer for file uploads (disk storage, temp folder)
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Update profile image (expects image as file)
router.post('/profile/image', auth, upload.single('image'), updateProfileImage);

// Delete profile image
router.delete('/profile/image', auth, deleteProfileImage);

// Get all users 
router.get('/', auth, checkRole(['developer', 'financier', 'admin']), getAllUsers);

// Update user profile
router.patch('/profile', auth, updateProfile);

// Update user category (developer only)
router.patch('/:userId/category', auth, checkRole(['developer']), updateUserCategory);

// Delete user (developer only)
router.delete('/:userId', auth, checkRole(['developer']), deleteUser);

// Update user role (developer only)
router.patch('/:userId/role', auth, checkRole(['developer']), updateUserRole);

// Get user profile
router.get('/profile', auth, getProfile);

// Update language preference
router.patch('/language', auth, updateLanguage);

export default router;
