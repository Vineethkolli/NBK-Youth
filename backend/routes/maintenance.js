import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { maintenanceController } from '../controllers/maintenanceController.js';

const router = express.Router();

router.get('/status', maintenanceController.getStatus);
router.post('/toggle', auth, checkRole('Privileged'), maintenanceController.toggleMode);

export default router;
