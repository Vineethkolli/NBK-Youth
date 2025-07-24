import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { activityLogController } from '../controllers/activityLogController.js';

const router = express.Router();

// Get all activity logs (developer only)
router.get('/', 
  auth, 
  checkRole(['developer']),
  activityLogController.getAllLogs
);

// Get log statistics (developer only)
router.get('/stats', 
  auth, 
  checkRole(['developer']),
  activityLogController.getLogStats
);

// Clear old logs (developer only)
router.delete('/clear', 
  auth, 
  checkRole(['developer']),
  activityLogController.clearOldLogs
);

export default router;