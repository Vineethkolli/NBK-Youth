
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import CollectionController from '../controllers/collectionController.js';
import multer from 'multer';

// Configure multer for file uploads (disk storage, temp folder)
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Get all collections
router.get('/', CollectionController.getAllCollections);

// Create collection (privileged users only)
router.post('/', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  CollectionController.createCollection
);

// Update collection
router.put('/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  CollectionController.updateCollection
);

// Delete collection
router.delete('/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  CollectionController.deleteCollection
);

// Upload song (audio file, field name: 'file')
router.post(
  '/:collectionId/songs',
  auth,
  upload.single('file'),
  CollectionController.uploadSong
);

// Update song (audio file, field name: 'file')
router.put(
  '/:collectionId/songs/:songId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  upload.single('file'),
  CollectionController.updateSong
);

// Delete song
router.delete('/:collectionId/songs/:songId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  CollectionController.deleteSong
);

export default router;