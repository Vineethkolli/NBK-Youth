import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { verificationController } from '../controllers/verificationController.js';

const router = express.Router();

router.get('/:type', auth, checkRole('Pro'), verificationController.getVerificationData);
router.patch('/:type/:id', auth, checkRole('Pro'), verificationController.updateVerificationStatus);

export default router;
