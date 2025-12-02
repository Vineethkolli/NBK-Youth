import express from 'express';
import { auth } from '../middleware/auth.js';
import { getProfile, updateProfile, updateLanguage, updateProfileImage, deleteProfileImage, 
    changePassword, linkGoogleAccount, unlinkGoogleAccount, sendEmailOTP } from '../controllers/profileController.js';

const router = express.Router();

router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);
router.patch('/language', auth, updateLanguage);
router.post('/image', auth, updateProfileImage);
router.delete('/image', auth, deleteProfileImage);

router.post('/send-email-otp', auth, sendEmailOTP);
router.post('/change-password', auth, changePassword);
router.post('/link-google', auth, linkGoogleAccount);
router.post('/unlink-google', auth, unlinkGoogleAccount);

export default router;
