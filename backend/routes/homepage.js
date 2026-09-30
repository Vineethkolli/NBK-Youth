import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { homepageController } from '../controllers/homepageController.js';

const router = express.Router();

// Slide routes
router.get('/slides', homepageController.getSlides);
router.post('/slides', auth, checkRole('Privileged'), homepageController.addSlide);
router.delete('/slides/:id', auth, checkRole('Privileged'), homepageController.deleteSlide);
router.put('/slides/order', auth, checkRole('Privileged'), homepageController.updateSlideOrder);

// Event Timeline routes
router.get('/event-timeline', homepageController.getEventTimeline);
router.post('/event-timeline', auth, checkRole('Privileged'), homepageController.addEventTimeline);
router.put('/event-timeline/:id', auth, checkRole('Privileged'), homepageController.updateEventTimeline);
router.delete('/event-timeline/:id', auth, checkRole('Privileged'), homepageController.deleteEventTimeline);

export default router;
