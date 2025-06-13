import { Router } from 'express';
import { 
    getAllHotels, 
    getHotelByName, 
    createHotel, 
    updateHotel, 
    deleteHotel
} from '../controllers/hotelController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

//protected routes
router.post('/hotels', authenticateToken, createHotel);
router.put('/hotels/:id', authenticateToken, updateHotel);
router.delete('/hotels/:id', authenticateToken, deleteHotel);

//public routes
router.get('/hotels', getAllHotels);
router.get('/hotels/:name', getHotelByName);

export default router;