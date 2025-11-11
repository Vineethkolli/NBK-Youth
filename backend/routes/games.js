import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { gameController } from '../controllers/gameController.js';

const router = express.Router();

router.get('/', gameController.getAllGames);
router.post('/', auth, checkRole('Privileged'), gameController.createGame);
router.put('/:id', auth, checkRole('Privileged'), gameController.updateGame);
router.delete('/:id', auth, checkRole('Privileged'), gameController.deleteGame);

router.post('/:id/players', auth, checkRole('Privileged'), gameController.addPlayer);
router.put('/:gameId/players/:playerId', auth, checkRole('Privileged'), gameController.updatePlayer);
router.delete('/:gameId/players/:playerId', auth, checkRole('Privileged'), gameController.deletePlayer);

export default router;
