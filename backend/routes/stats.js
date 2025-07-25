import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { statsController } from '../controllers/statsController.js';

const router = express.Router();

// Get all stats
router.get('/', auth, statsController.getStats);

router.patch('/previous-year', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  statsController.updatePreviousYear
);

export default router;