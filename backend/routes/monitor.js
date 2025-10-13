import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { getStorageQuota, getFileList, getTrashList, trashItem, restoreItem, deleteItemPermanent,
 downloadItem } from '../controllers/serviceDriveController.js';

const router = express.Router();

// Service Drive Routes
router.get('/drive/quota', auth, checkRole(['developer']), getStorageQuota);
router.get('/drive/files', auth, checkRole(['developer']), getFileList);
router.get('/drive/trash', auth, checkRole(['developer']), getTrashList);
router.put('/item/trash/:fileId', auth, checkRole(['developer']), trashItem);
router.put('/item/restore/:fileId', auth, checkRole(['developer']), restoreItem);
router.delete('/item/delete/:fileId', auth, checkRole(['developer']), deleteItemPermanent);
router.get('/item/download/:fileId', auth, checkRole(['developer']), downloadItem); 

export default router;
