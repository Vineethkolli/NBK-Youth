import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import VibeController from '../controllers/vibeController.js';

const router = express.Router();

// collections routes
router.get('/', VibeController.getAllCollections);
router.post('/', auth, checkRole('Privileged'), VibeController.createCollection);
router.put('/:id', auth, checkRole('Privileged'), VibeController.updateCollection);
router.delete('/:id', auth, checkRole('Privileged'), VibeController.deleteCollection);

// song routes
router.post('/:collectionId/songs', auth, checkRole('Privileged'), VibeController.uploadSong);
router.post('/:collectionId/songs/bulk', auth, checkRole('Privileged'), VibeController.uploadMultipleSongs);
router.put('/:collectionId/songs/:songId', auth, checkRole('Privileged'), VibeController.updateSong);
router.delete('/:collectionId/songs/:songId', auth, checkRole('Privileged'), VibeController.deleteSong);

export default router;
