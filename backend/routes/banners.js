
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { bannerController } from '../controllers/bannerController.js';
import multer from 'multer';

// Configure multer for file uploads (disk storage, temp folder)
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Get all banners (developer only)
router.get('/', auth, checkRole(['developer', 'financier', 'admin']), bannerController.getAllBanners);

// Get active banner (public)
router.get('/active', bannerController.getActiveBanner);

// Create banner (developer only, supports image and video upload)
router.post(
  '/',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  bannerController.createBanner
);

// Update banner (developer only, supports image and video upload)
router.put(
  '/:id',
  auth,
  checkRole(['developer', 'financier', 'admin']),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  bannerController.updateBanner
);

// Delete banner (developer only)
router.delete('/:id', auth, checkRole(['developer', 'financier', 'admin']), bannerController.deleteBanner);

export default router;