import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { hiddenProfileController } from '../controllers/hiddenProfileController.js';

const router = express.Router();

router.get('/', auth, hiddenProfileController.getHiddenProfiles);
router.post('/toggle', auth, checkRole(['developer', 'financier', 'admin']), hiddenProfileController.toggleHiddenProfile);

export default router;