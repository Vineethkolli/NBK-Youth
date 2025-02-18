import express from 'express';
import { auth } from '../middleware/auth.js';
import {signUp, signIn, forgotPassword, verifyOtp, resetPassword, changePassword  } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/change-password', auth, changePassword);

export default router;
