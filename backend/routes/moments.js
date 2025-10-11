import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { momentController } from '../controllers/momentController.js';
import { galleryController } from '../controllers/momentGalleryController.js'; 
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const authRoles = ['developer', 'admin', 'financier'];


// Moment Routes

router.get('/', momentController.getAllMoments);

router.post('/youtube', auth, checkRole(authRoles), momentController.addYouTubeMoment);
router.post('/drive', auth, checkRole(authRoles), momentController.addDriveMoment);
router.post('/copy-to-service-drive', auth, checkRole(authRoles), momentController.addCopyToServiceDriveMoment);
router.post('/upload', auth, checkRole(authRoles), upload.array('files', 20), momentController.uploadMediaMoment);

router.put('/order', auth, checkRole(authRoles), momentController.updateMomentOrder);
router.patch('/:id/title', auth, checkRole(authRoles), momentController.updateMomentTitle);
router.delete('/:id', auth, checkRole(authRoles), momentController.deleteMoment);


// Gallery Routes

router.post('/:momentId/gallery/copy-to-service-drive', auth, checkRole(authRoles), galleryController.addCopyToServiceDriveGallery);
router.post('/:momentId/gallery/upload', auth, checkRole(authRoles), upload.array('files', 20), galleryController.uploadMediaGallery);

router.put('/:momentId/gallery/order', auth, checkRole(authRoles), galleryController.updateGalleryOrder);
router.delete('/:momentId/gallery/:mediaId', auth, checkRole(authRoles), galleryController.deleteGalleryFile);


export default router;
