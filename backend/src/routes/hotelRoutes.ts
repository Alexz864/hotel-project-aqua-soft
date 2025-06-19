import { Router } from 'express';
import { 
    getAllHotels, 
    getHotelByName, 
    createHotel, 
    updateHotel, 
    deleteHotel,
    getHotelsWithReviews,
    getHotelDetailsWithReviews,
    getHotelById,
    getHotelsWithReviewsAndManagers,
    getAllCities,
    getAllStatesProvinces
} from '../controllers/hotelController';
import { authenticateToken } from '../middleware/authMiddleware';
import { checkPermission } from '../middleware/permisionMiddleware';
import { getHotelsForManager } from '../controllers/hotelController';

const router = Router();

//protected routes
router.post('/hotels', authenticateToken, checkPermission('hotels', 'write'), createHotel);
router.put('/hotels/:id', authenticateToken, checkPermission('hotels', 'write'), updateHotel);
router.delete('/hotels/:id', authenticateToken, checkPermission('hotels', 'write'), deleteHotel);
router.get('/hotels-with-reviews-and-managers', authenticateToken, checkPermission('hotels', 'write'), getHotelsWithReviewsAndManagers);
router.get('/cities', authenticateToken, checkPermission('hotels', 'write'), getAllCities);
router.get('/states-provinces', authenticateToken, checkPermission('hotels', 'write'), getAllStatesProvinces);


//public routes
router.get('/hotels/manager', authenticateToken, getHotelsForManager);
router.get('/hotels', getAllHotels);
router.get('/hotels/:id', getHotelById);
router.get('/hotels/:name', getHotelByName);
router.get('/hotels-with-reviews', getHotelsWithReviews);
router.get('/hotels/:id/details', getHotelDetailsWithReviews);

export default router;