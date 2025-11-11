import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { snapshotController } from '../controllers/snapshotController.js';

const router = express.Router();

router.get('/', auth, checkRole('Developer'), snapshotController.getAllSnapshots);
router.post('/', auth, checkRole('Developer'), snapshotController.createSnapshot);
router.put('/:id', auth, checkRole('Developer'), snapshotController.updateSnapshot);
router.delete('/:id', auth, checkRole('Developer'), snapshotController.deleteSnapshot);

export default router;
