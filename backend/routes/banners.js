import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { bannerController } from '../controllers/bannerController.js';

const router = express.Router();

router.get('/', auth, checkRole('Privileged'), bannerController.getAllBanners);
router.get('/active', bannerController.getActiveBanner);

router.post('/', auth, checkRole('Privileged'), bannerController.createBanner);
router.put('/:id', auth, checkRole('Privileged'), bannerController.updateBanner);
router.delete('/:id', auth, checkRole('Privileged'), bannerController.deleteBanner);

export default router;
