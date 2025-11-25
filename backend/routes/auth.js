import express from 'express';
import { checkSignupInfo, signUp, signIn, forgotPassword, verifyOtp, resetPassword, initiatePhonePasswordReset, 
  issuePhoneResetToken, googleAuth, refreshSession, updateLastActive, signOut, listSessions, revokeSession } from '../controllers/authController.js';

import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup/check', checkSignupInfo);
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/google-auth', googleAuth);
router.post('/refresh', refreshSession);
router.get('/last-active', updateLastActive);
router.get('/lastActive', updateLastActive);
router.post('/signout', auth, signOut);
router.get('/sessions', auth, listSessions);
router.post('/sessions/:sessionId/revoke', auth, revokeSession);

router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/phone', initiatePhonePasswordReset);
router.post('/forgot-password/phone/token', issuePhoneResetToken);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
