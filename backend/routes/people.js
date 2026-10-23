import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { peopleController } from '../controllers/peopleController.js';

const router = express.Router();
router.get('/', auth, peopleController.getPeople);
router.post('/', auth, checkRole('Pro'), peopleController.createPerson);
router.put('/:id', auth, checkRole('Pro'), peopleController.updatePerson);
router.delete('/:id', auth, checkRole('Pro'), peopleController.deletePerson);
export default router;
