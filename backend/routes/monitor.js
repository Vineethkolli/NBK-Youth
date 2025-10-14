import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { serviceDriveStorageController } from '../controllers/serviceDriveStorageController.js';
import { cloudinaryStorageController } from '../controllers/cloudinaryStorageController.js';

const router = express.Router();

// Service Drive Storage Routes
router.get('/drive/quota', auth, checkRole(['developer']), serviceDriveStorageController.getStorageQuota);
router.get('/drive/files', auth, checkRole(['developer']), serviceDriveStorageController.getFileList);
router.get('/drive/trash', auth, checkRole(['developer']), serviceDriveStorageController.getTrashList);
router.get('/item/download/:fileId', auth, checkRole(['developer']), serviceDriveStorageController.downloadItem);
router.put('/item/trash/:fileId', auth, checkRole(['developer']), serviceDriveStorageController.trashItem);
router.delete('/item/delete/:fileId', auth, checkRole(['developer']), serviceDriveStorageController.deleteItemPermanent);
router.delete('/item/trash/empty', auth, checkRole(['developer']), serviceDriveStorageController.emptyTrash);


// Cloudinary Monitor Routes
router.get('/cloudinary/quota', auth, checkRole(['developer']), cloudinaryStorageController.getStorageQuota);
router.get('/cloudinary/folders', auth, checkRole(['developer']), cloudinaryStorageController.listCloudinaryFolders);

export default router;
