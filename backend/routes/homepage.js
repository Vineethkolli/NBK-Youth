
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { homepageController } from '../controllers/homepageController.js';
import multer from 'multer';

// Configure multer for file uploads (in-memory storage)
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Slide routes
router.get('/slides', homepageController.getSlides);
router.post('/slides', auth, checkRole(['developer', 'financier', 'admin']), upload.single('file'), homepageController.addSlide);
router.delete('/slides/:id', auth, checkRole(['developer', 'financier', 'admin']), homepageController.deleteSlide);
router.put('/slides/order', auth, checkRole(['developer', 'financier', 'admin']), homepageController.updateSlideOrder);

// Event routes
router.get('/events', homepageController.getEvents);
router.post('/events', auth, checkRole(['developer', 'financier', 'admin']), homepageController.addEvent);
router.delete('/events/:id', auth, checkRole(['developer', 'financier', 'admin']), homepageController.deleteEvent);

export default router;