import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import CollectionController from '../controllers/collectionController.js';

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

// Create sub-collection
router.post('/:collectionId/subcollections',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  CollectionController.createSubCollection
);

// Update sub-collection
router.put('/:collectionId/subcollections/:subCollectionId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  CollectionController.updateSubCollection
);

// Delete sub-collection
router.delete('/:collectionId/subcollections/:subCollectionId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  CollectionController.deleteSubCollection
);

// Upload song
router.post('/:collectionId/subcollections/:subCollectionId/songs',
  auth,
  CollectionController.uploadSong
);

// Update song
router.put('/:collectionId/subcollections/:subCollectionId/songs/:songId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  CollectionController.updateSong
);

// Delete song
router.delete('/:collectionId/subcollections/:subCollectionId/songs/:songId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  CollectionController.deleteSong
);

export default router;