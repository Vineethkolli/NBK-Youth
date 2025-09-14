
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import VibeController from '../controllers/vibeController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Get all collections
router.get('/', VibeController.getAllCollections);

// Create collection (privileged users only)
router.post('/', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  VibeController.createCollection
);

// Update collection
router.put('/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  VibeController.updateCollection
);

// Delete collection
router.delete('/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  VibeController.deleteCollection
);

// Upload song (audio file, field name: 'file')
router.post(
  '/:collectionId/songs',
  auth,
  upload.single('file'),
  VibeController.uploadSong
);

// Update song (audio file, field name: 'file')
router.put(
  '/:collectionId/songs/:songId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  upload.single('file'),
  VibeController.updateSong
);

// Delete song
router.delete('/:collectionId/songs/:songId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  VibeController.deleteSong
);

export default router;