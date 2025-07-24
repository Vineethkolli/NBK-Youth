import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { bannerController } from '../controllers/bannerController.js';

const router = express.Router();

// Get all banners (developer only)
router.get('/', auth, checkRole(['developer', 'financier', 'admin']), bannerController.getAllBanners);

// Get active banner (public)
router.get('/active', bannerController.getActiveBanner);

// Create banner (developer only)
router.post('/', auth, checkRole(['developer', 'financier', 'admin']), bannerController.createBanner);

// Update banner (developer only)
router.put('/:id', auth, checkRole(['developer', 'financier', 'admin']), bannerController.updateBanner);

// Delete banner (developer only)
router.delete('/:id', auth, checkRole(['developer', 'financier', 'admin']), bannerController.deleteBanner);

export default router;