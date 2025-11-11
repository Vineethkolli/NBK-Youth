import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { homepageController } from '../controllers/homepageController.js';

const router = express.Router();

// Slide routes
router.get('/slides', homepageController.getSlides);
router.post('/slides', auth, checkRole('Privileged'), homepageController.addSlide);
router.delete('/slides/:id', auth, checkRole('Privileged'), homepageController.deleteSlide);
router.put('/slides/order', auth, checkRole('Privileged'), homepageController.updateSlideOrder);

// Event routes
router.get('/events', homepageController.getEvents);
router.post('/events', auth, checkRole('Privileged'), homepageController.addEvent);
router.delete('/events/:id', auth, checkRole('Privileged'), homepageController.deleteEvent);

export default router;
