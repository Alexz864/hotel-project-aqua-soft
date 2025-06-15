import { Router } from 'express';
import { 
    getAllUsers, 
    getUserById,
    createUser, 
    updateUser,
    updateUserRole, 
    deleteUser
} from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

//admin only user management routes
router.get('/users', authenticateToken, getAllUsers);
router.get('/users/:id', authenticateToken, getUserById);
router.post('/users', authenticateToken, createUser);
router.put('/users/:id', authenticateToken, updateUser);
router.put('/users/:id/role', authenticateToken, updateUserRole);
router.delete('/users/:id', authenticateToken, deleteUser);

export default router;