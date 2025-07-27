
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { developerController } from '../controllers/developerController.js';

const router = express.Router();

// Clear data (same)
router.delete('/clear/:type',      auth, checkRole(['developer']), developerController.clearData);

// Storage‐info routes: drop the extra “developer” segment
router.get('/mongodb-storage',     auth, checkRole(['developer']), developerController.getMongoStats);
router.get('/drive-stats',         auth, checkRole(['developer']), developerController.getDriveStats);
router.get('/cloudinary-stats',    auth, checkRole(['developer']), developerController.getCloudinaryStats);

export default router;
