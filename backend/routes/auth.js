import express from 'express';
import { checkSignupInfo, signUp, signIn, forgotPassword, verifyOtp, resetPassword, initiatePhonePasswordReset, 
  issuePhoneResetToken, googleAuth, refreshAccessToken, logout, getSessions, deleteSession } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Authentication
router.post('/signup/check', checkSignupInfo);
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/google-auth', googleAuth);

// Password reset
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/phone', initiatePhonePasswordReset);
router.post('/forgot-password/phone/token', issuePhoneResetToken);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Token & Session management
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/sessions', auth, getSessions);
router.delete('/sessions/:sessionId', auth, deleteSession);

export default router;
