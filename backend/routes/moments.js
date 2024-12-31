import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { momentController } from '../controllers/momentController.js';

const router = express.Router();

router.get('/', momentController.getAllMoments);
router.post('/youtube', auth, checkRole(['developer', 'admin', 'financier']), momentController.addYouTubeMoment);
router.post('/media', auth, checkRole(['developer', 'admin', 'financier']), momentController.uploadMediaMoment);
router.delete('/:id', auth, checkRole(['developer', 'admin', 'financier']), momentController.deleteMoment);
router.patch('/:id/pin',auth,checkRole(['developer', 'admin', 'financier']),momentController.togglePin);
router.patch('/:id/title', auth, checkRole(['developer', 'admin', 'financier']), momentController.updateTitle);
export default router;