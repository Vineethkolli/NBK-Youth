import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { universalPinController } from '../controllers/universalPinController.js';

const router = express.Router();
router.get('/status', auth, checkRole('Developer'), universalPinController.status);
router.post('/verify', auth, checkRole('Developer'), universalPinController.verify);
router.post('/request-otp', auth, checkRole('Developer'), universalPinController.requestOtp);
router.post('/verify-otp', auth, checkRole('Developer'), universalPinController.verifyOtp);
router.post('/change', auth, checkRole('Developer'), universalPinController.change);

export default router;
