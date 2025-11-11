import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { historyController } from '../controllers/historyController.js';

const router = express.Router();

router.get('/', historyController.getAllHistories);
router.post('/', auth, checkRole('Developer'), historyController.createHistory);
router.delete('/:id', auth, checkRole('Developer'), historyController.deleteHistory);

export default router;
