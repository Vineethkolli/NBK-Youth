import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import VibeController from '../controllers/vibeController.js';

const router = express.Router();

// collections routes
router.get('/', VibeController.getAllCollections);
router.post('/', auth, checkRole(['developer', 'financier', 'admin']), VibeController.createCollection);
router.put('/:id', auth, checkRole(['developer', 'financier', 'admin']), VibeController.updateCollection);
router.delete('/:id', auth, checkRole(['developer', 'financier', 'admin']), VibeController.deleteCollection);

// song routes
router.post('/:collectionId/songs', auth, checkRole(['developer', 'financier', 'admin']), VibeController.uploadSong);
router.post('/:collectionId/songs/bulk', auth, checkRole(['developer', 'financier', 'admin']), VibeController.uploadMultipleSongs);
router.put('/:collectionId/songs/:songId', auth, checkRole(['developer', 'financier', 'admin']), VibeController.updateSong);
router.delete('/:collectionId/songs/:songId', auth, checkRole(['developer', 'financier', 'admin']), VibeController.deleteSong);

export default router;