import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { snapshotController } from '../controllers/snapshotController.js';

const router = express.Router();

router.get('/', auth, checkRole(['developer']), snapshotController.getAllSnapshots);
router.post('/', auth, checkRole(['developer']), snapshotController.createSnapshot);
router.put('/:id', auth, checkRole(['developer']), snapshotController.updateSnapshot);
router.delete('/:id', auth, checkRole(['developer']), snapshotController.deleteSnapshot);

export default router;