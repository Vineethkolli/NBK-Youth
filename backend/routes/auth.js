import express from 'express';
import {
  signUp,
  signIn,
  forgotPassword,
  verifyOtp,
  resetPassword,
  checkPhoneExists, // ✅ add this
} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/check-phone', checkPhoneExists); // ✅ add this line

export default router;
