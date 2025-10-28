import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { gameController } from '../controllers/gameController.js';

const router = express.Router();

// Game routes
router.get('/', gameController.getAllGames);
router.post('/',  auth,  checkRole(['developer', 'financier', 'admin']), gameController.createGame);
router.put('/:id', auth, checkRole(['developer', 'financier', 'admin']), gameController.updateGame);
router.delete('/:id', auth, checkRole(['developer', 'financier', 'admin']), gameController.deleteGame);

// Player routes
router.post('/:id/players', auth, checkRole(['developer', 'financier', 'admin']), gameController.addPlayer);
router.put('/:gameId/players/:playerId', auth, checkRole(['developer', 'financier', 'admin']), gameController.updatePlayer);
router.delete('/:gameId/players/:playerId', auth, checkRole(['developer', 'financier', 'admin']), gameController.deletePlayer);

export default router;