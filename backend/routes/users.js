import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { getAllUsers, updateUserCategory, updateUserRole, updateUserProfile, 
     deleteUser } from '../controllers/usersController.js';

const router = express.Router();

router.get('/', auth, checkRole('Privileged'), getAllUsers);
router.patch('/:userId/category', auth, checkRole('Privileged'), updateUserCategory);
router.patch('/:userId/role', auth, checkRole('Privileged'), updateUserRole);

router.patch('/:userId', auth, checkRole('Developer'), updateUserProfile);
router.delete('/:userId', auth, checkRole('Developer'), deleteUser);

export default router;
