import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { lockSettingsController } from '../controllers/lockSettingsController.js';

const router = express.Router();

// Get lock status (public)
router.get('/', lockSettingsController.getLockStatus);

// Toggle lock status (admin only)
router.post('/toggle', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  lockSettingsController.toggleLockStatus
);

export default router;