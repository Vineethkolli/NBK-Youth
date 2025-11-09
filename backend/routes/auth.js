import express from 'express';
import { signUp, signIn, forgotPassword, verifyOtp, resetPassword, initiatePhonePasswordReset,
	issuePhoneResetToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/phone', initiatePhonePasswordReset);
router.post('/forgot-password/phone/token', issuePhoneResetToken);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
