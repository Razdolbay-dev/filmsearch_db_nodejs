import { Router } from 'express';
import MoviesController from '../controllers/moviesController.js';
import { excludeContentController } from '../controllers/mainController.js';
import trendingController from '../controllers/trendingController.js'

const router = Router();
const moviesController = new MoviesController();

// Базовые маршруты
router.get('/', moviesController.getAllMovies);

// Дополнительные маршруты для получения данных напрямую из TMDB (облегченные)
router.get('/trending', trendingController.getTrendingMovies);
router.get('/trending/tmdb', trendingController.getTrendingMoviesFromTMDB);

router.get('/search', moviesController.searchMovies);
router.get('/popular', moviesController.getPopularMovies);
router.post('/exclude/:id', excludeContentController);

// Маршруты с параметрами
router.get('/genre/:genreId', moviesController.getMoviesByGenre);
router.get('/year/:year', moviesController.getMoviesByYear);
router.get('/:id', moviesController.getMovieById);

export default router;