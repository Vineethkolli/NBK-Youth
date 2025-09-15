import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { activityLogController } from '../controllers/activityLogController.js';

const router = express.Router();

router.get('/', auth, checkRole(['developer']), activityLogController.getAllLogs);
router.get('/stats', auth, checkRole(['developer']), activityLogController.getLogStats);

export default router;