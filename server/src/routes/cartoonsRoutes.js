import { Router } from 'express';
import CartoonsController from '../controllers/cartoonsController.js';

const router = Router();
const cartoonsController = new CartoonsController();

// Базовые маршруты
router.get('/', cartoonsController.getAllCartoons); // Сюда приходят все query параметры
router.get('/popular', cartoonsController.getPopularCartoons);
router.get('/search', cartoonsController.searchCartoons);
router.get('/year/:year', cartoonsController.getCartoonsByYear);
router.get('/:id', cartoonsController.getCartoonById);

export default router;