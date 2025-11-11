import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { momentController } from '../controllers/momentController.js';
import { galleryController } from '../controllers/momentGalleryController.js'; 

const router = express.Router();

// Moment Routes
router.get('/', momentController.getAllMoments);
router.post('/youtube', auth, checkRole('Privileged'), momentController.addYouTubeMoment);
router.post('/drive', auth, checkRole('Privileged'), momentController.addDriveMoment);

// Sync Drive folder moment
router.post('/:id/sync', auth, checkRole('Privileged'), momentController.syncDriveFolderMoment);
router.post('/copy-to-service-drive', auth, checkRole('Privileged'), momentController.addCopyToServiceDriveMoment);

// Moment media upload from frontend
router.post('/upload/start', auth, checkRole('Privileged'), momentController.startuploadMediaMoment);
router.post('/upload/complete', auth, checkRole('Privileged'), momentController.completeuploadMediaMoment);
router.put('/order', auth, checkRole('Privileged'), momentController.updateMomentOrder);
router.patch('/:id/title', auth, checkRole('Privileged'), momentController.updateMomentTitle);
router.delete('/:id', auth, checkRole('Privileged'), momentController.deleteMoment);


// Gallery Routes
router.post('/:momentId/gallery/copy-to-service-drive', auth, checkRole('Privileged'), galleryController.addCopyToServiceDriveGallery);

// Gallery media upload from frontend
router.post('/:momentId/gallery/upload/start', auth, checkRole('Privileged'), galleryController.startuploadMediaGallery);
router.post('/:momentId/gallery/upload/complete', auth, checkRole('Privileged'), galleryController.completeuploadMediaGallery);
router.put('/:momentId/gallery/order', auth, checkRole('Privileged'), galleryController.updateGalleryOrder);
router.delete('/:momentId/gallery/:mediaId', auth, checkRole('Privileged'), galleryController.deleteGalleryFile);

router.get('/download/:fileId', galleryController.downloadMediaFile);

export default router;
