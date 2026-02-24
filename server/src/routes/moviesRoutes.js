import { Router } from 'express';
import MoviesController from '../controllers/moviesController.js';

const router = Router();
const moviesController = new MoviesController();

// Базовые маршруты
router.get('/', moviesController.getAllMovies);
router.get('/search', moviesController.searchMovies);
router.get('/popular', moviesController.getPopularMovies);

// Маршруты с параметрами
router.get('/genre/:genreId', moviesController.getMoviesByGenre);
router.get('/year/:year', moviesController.getMoviesByYear);
router.get('/:id', moviesController.getMovieById);

export default router;