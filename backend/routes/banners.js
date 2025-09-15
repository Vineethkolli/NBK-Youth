
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { bannerController } from '../controllers/bannerController.js';
import multer from 'multer';

// Configure multer for file uploads (in-memory storage)
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', auth, checkRole(['developer', 'financier', 'admin']), bannerController.getAllBanners);
router.get('/active', bannerController.getActiveBanner);

// Create banner (supports image and video upload)
router.post('/', auth, checkRole(['developer', 'financier', 'admin']),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 } ]), bannerController.createBanner);

// Update banner (supports image and video upload)
router.put('/:id', auth, checkRole(['developer', 'financier', 'admin']),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 } ]), bannerController.updateBanner);

router.delete('/:id', auth, checkRole(['developer', 'financier', 'admin']), bannerController.deleteBanner);

export default router;