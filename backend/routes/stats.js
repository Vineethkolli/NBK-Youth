import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { statsController } from '../controllers/statsController.js';

const router = express.Router();

// Get all stats
router.get('/', auth, statsController.getStats);

// Update previous year amount (developer/financier only)
router.patch('/previous-year', 
  auth, 
  checkRole(['developer', 'financier']),
  statsController.updatePreviousYear
);

export default router;