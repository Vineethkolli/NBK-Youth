import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { momentController } from '../controllers/momentController.js';

const router = express.Router();

router.get('/', momentController.getAllMoments);
router.post('/youtube', auth, checkRole(['developer', 'admin']), momentController.addYouTubeMoment);
router.post('/media', auth, checkRole(['developer', 'admin']), momentController.uploadMediaMoment);
router.delete('/:id', auth, checkRole(['developer', 'admin']), momentController.deleteMoment);
// In backend/routes/moments.js
router.patch('/:id/pin', auth, checkRole(['developer', 'admin']), momentController.togglePin);

export default router;