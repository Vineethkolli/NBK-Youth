import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { activityLogController } from '../controllers/activityLogController.js';

const router = express.Router();

router.get('/', auth, checkRole('Developer'), activityLogController.getAllLogs);
router.get('/stats', auth, checkRole('Developer'), activityLogController.getLogStats);

export default router;