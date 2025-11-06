import express from 'express';
import { auth } from '../middleware/auth.js';
import { getProfile, updateProfile, updateLanguage, updateProfileImage, deleteProfileImage, 
    changePassword } from '../controllers/profileController.js';

const router = express.Router();

router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);
router.patch('/language', auth, updateLanguage);
router.post('/image', auth, updateProfileImage);
router.delete('/image', auth, deleteProfileImage);

router.post('/change-password', auth, changePassword);

export default router;
