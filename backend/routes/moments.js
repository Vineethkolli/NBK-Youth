import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { momentController } from '../controllers/momentController.js';
import { momentMediaController } from '../controllers/momentMediaController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const authRoles = ['developer', 'admin', 'financier'];

// --- Moment Routes ---
router.get('/', momentController.getAllMoments);

router.post('/youtube', auth, checkRole(authRoles), momentController.addYouTubeMoment);
router.post('/drive', auth, checkRole(authRoles), momentController.addDriveMoment);
router.post('/drive-media', auth, checkRole(authRoles), momentController.addDriveMediaMoment);
router.post('/upload', auth, checkRole(authRoles), upload.array('files', 20), momentController.uploadMediaMoment);

router.put('/order', auth, checkRole(authRoles), momentController.updateMomentOrder);
router.patch('/:id/title', auth, checkRole(authRoles), momentController.updateTitle);
router.delete('/:id', auth, checkRole(authRoles), momentController.deleteMoment);


// --- Moment Media Routes ---
router.post('/:momentId/media', auth, checkRole(authRoles), upload.array('files', 20), momentMediaController.addMediaToMoment);
router.post('/:momentId/drive-media', auth, checkRole(authRoles), momentMediaController.addDriveMediaToMoment);

router.put('/:momentId/media-order', auth, checkRole(authRoles), momentMediaController.updateMediaOrder);

router.delete('/:momentId/media/:mediaId', auth, checkRole(authRoles), momentMediaController.deleteMediaFile);


export default router;
