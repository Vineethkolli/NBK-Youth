
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { bannerController } from '../controllers/bannerController.js';

const router = express.Router();

router.get('/', auth, checkRole(['developer', 'financier', 'admin']), bannerController.getAllBanners);
router.get('/active', bannerController.getActiveBanner);

// Create banner (supports image and video upload)
router.post('/', auth, checkRole(['developer', 'financier', 'admin']), bannerController.createBanner);

// Update banner (supports image and video upload)
router.put('/:id', auth, checkRole(['developer', 'financier', 'admin']), bannerController.updateBanner);

router.delete('/:id', auth, checkRole(['developer', 'financier', 'admin']), bannerController.deleteBanner);

export default router;