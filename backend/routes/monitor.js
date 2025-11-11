import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { serviceDriveStorageController } from '../controllers/serviceDriveStorageController.js';
import { cloudinaryStorageController } from '../controllers/cloudinaryStorageController.js';
import { mongodbStorageController } from '../controllers/mongodbStorageController.js';
import { githubActionsController } from '../controllers/githubActionsController.js';

const router = express.Router();

// Service Drive Storage Routes
router.get('/drive/quota', auth, checkRole('Developer'), serviceDriveStorageController.getStorageQuota);
router.get('/drive/files', auth, checkRole('Developer'), serviceDriveStorageController.getFileList);
router.get('/drive/trash', auth, checkRole('Developer'), serviceDriveStorageController.getTrashList);
router.get('/item/download/:fileId', auth, checkRole('Developer'), serviceDriveStorageController.downloadItem);
router.put('/item/trash/:fileId', auth, checkRole('Developer'), serviceDriveStorageController.trashItem);
router.delete('/item/delete/:fileId', auth, checkRole('Developer'), serviceDriveStorageController.deleteItemPermanent);
router.delete('/item/trash/empty', auth, checkRole('Developer'), serviceDriveStorageController.emptyTrash);

// Cloudinary Monitor Routes
router.get('/cloudinary/quota', auth, checkRole('Developer'), cloudinaryStorageController.getStorageQuota);
router.get('/cloudinary/folders', auth, checkRole('Developer'), cloudinaryStorageController.listCloudinaryFolders);

// MongoDB Monitor Routes
router.get('/mongodb/cluster', auth, checkRole('Developer'), mongodbStorageController.getClusterInfo);
router.get('/mongodb/collections', auth, checkRole('Developer'), mongodbStorageController.getCollectionsInfo);

// GitHub Actions Monitor Routes
router.get('/github/actions/all', auth, checkRole('Developer'), githubActionsController.getAllData);
router.get('/github/actions/metrics', auth, checkRole('Developer'), githubActionsController.getMetricsOnly);
router.get('/github/actions/workflows', auth, checkRole('Developer'), githubActionsController.getWorkflowsOnly);

export default router;
