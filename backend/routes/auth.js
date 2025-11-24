import express from 'express';
import { auth } from '../middleware/auth.js';
import { checkSignupInfo, signUp, signIn, forgotPassword, verifyOtp, resetPassword, initiatePhonePasswordReset, 
  issuePhoneResetToken, googleAuth, refreshSession, pingSession, logout } from '../controllers/authController.js';
import { listSessions, revokeSession } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/signup/check', checkSignupInfo);
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/google-auth', googleAuth);
router.post('/refresh', refreshSession);
router.get('/ping', pingSession);
router.post('/logout', auth, logout);

router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/phone', initiatePhonePasswordReset);
router.post('/forgot-password/phone/token', issuePhoneResetToken);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/sessions', auth, listSessions);
router.delete('/sessions/:sessionId', auth, revokeSession);

export default router;
