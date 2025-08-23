import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { snapshotController } from '../controllers/snapshotController.js';

const router = express.Router();

// Get all snapshots (developer only)
router.get('/', 
  auth, 
  checkRole(['developer']),
  snapshotController.getAllSnapshots
);

// Create snapshot (developer only)
router.post('/', 
  auth, 
  checkRole(['developer']),
  snapshotController.createSnapshot
);

// Update snapshot (developer only)
router.put('/:id', 
  auth, 
  checkRole(['developer']),
  snapshotController.updateSnapshot
);

// Delete snapshot (developer only)
router.delete('/:id', 
  auth, 
  checkRole(['developer']),
  snapshotController.deleteSnapshot
);

export default router;