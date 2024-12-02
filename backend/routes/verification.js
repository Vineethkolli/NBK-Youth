import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { verificationController } from '../controllers/verificationController.js';

const router = express.Router();

// Get verification data (developer, financier only)
router.get('/:type', 
  auth, 
  checkRole(['developer', 'financier']),
  verificationController.getVerificationData
);

// Update verification status (developer, financier only)
router.patch('/:type/:id', 
  auth,
  checkRole(['developer', 'financier']),
  verificationController.updateVerificationStatus
);

export default router;