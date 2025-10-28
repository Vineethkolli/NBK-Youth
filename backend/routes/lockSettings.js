import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { lockSettingsController } from '../controllers/lockSettingsController.js';

const router = express.Router();

router.get('/', lockSettingsController.getLockStatus);

router.post('/toggle',  auth,  checkRole(['developer']), lockSettingsController.toggleLockStatus);

export default router;