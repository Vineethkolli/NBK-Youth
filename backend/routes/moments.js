import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { momentController } from '../controllers/momentController.js';
import { galleryController } from '../controllers/momentGalleryController.js'; 

const router = express.Router();
const authRoles = ['developer', 'admin', 'financier'];

// Moment Routes
router.get('/', momentController.getAllMoments);

router.post('/youtube', auth, checkRole(authRoles), momentController.addYouTubeMoment);

router.post('/drive', auth, checkRole(authRoles), momentController.addDriveMoment);
// Sync (refresh) Drive folder moment
router.post('/:id/sync', auth, checkRole(authRoles), momentController.syncDriveFolderMoment);

router.post('/copy-to-service-drive', auth, checkRole(authRoles), momentController.addCopyToServiceDriveMoment);

// Moment media upload from frontend
router.post('/upload/start', auth, checkRole(authRoles), momentController.startuploadMediaMoment);
router.post('/upload/complete', auth, checkRole(authRoles), momentController.completeuploadMediaMoment);

router.put('/order', auth, checkRole(authRoles), momentController.updateMomentOrder);
router.patch('/:id/title', auth, checkRole(authRoles), momentController.updateMomentTitle);
router.delete('/:id', auth, checkRole(authRoles), momentController.deleteMoment);



// Gallery Routes
router.post('/:momentId/gallery/copy-to-service-drive', auth, checkRole(authRoles), galleryController.addCopyToServiceDriveGallery);

// Gallery media upload from frontend
router.post('/:momentId/gallery/upload/start', auth, checkRole(authRoles), galleryController.startuploadMediaGallery);
router.post('/:momentId/gallery/upload/complete', auth, checkRole(authRoles), galleryController.completeuploadMediaGallery);

router.put('/:momentId/gallery/order', auth, checkRole(authRoles), galleryController.updateGalleryOrder);
router.delete('/:momentId/gallery/:mediaId', auth, checkRole(authRoles), galleryController.deleteGalleryFile);

export default router;
