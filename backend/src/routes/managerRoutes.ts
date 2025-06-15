import { Router } from 'express';
import { getMyHotels, reassignHotel } from '../controllers/managerController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

//route for managers to view their own hotels
router.get('/my-hotels', authenticateToken,getMyHotels);

//route for admins to manage hotel assignments
router.put('/reassign-hotel/:hotelId', authenticateToken,reassignHotel);

export default router;