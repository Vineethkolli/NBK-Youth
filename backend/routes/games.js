import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { gameController } from '../controllers/gameController.js';

const router = express.Router();

// Get all games
router.get('/', gameController.getAllGames);

// Create game (privileged users only)
router.post('/', 
  auth, 
  checkRole(['developer', 'financier', 'admin']),
  gameController.createGame
);

// Update game
router.put('/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  gameController.updateGame
);

// Delete game
router.delete('/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  gameController.deleteGame
);

// Add player
router.post('/:id/players',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  gameController.addPlayer
);

// Update player
router.put('/:gameId/players/:playerId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  gameController.updatePlayer
);

// Delete player
router.delete('/:gameId/players/:playerId',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  gameController.deletePlayer
);

export default router;