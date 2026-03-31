import { Router } from 'express';
import SeriesController from '../controllers/seriesController.js';
import {excludeContentController} from "../controllers/mainController.js";
import trendingController from '../controllers/trendingController.js'

const router = Router();
const seriesController = new SeriesController();

// Базовые маршруты
router.get('/', seriesController.getAllSeries);

// Дополнительные маршруты для получения данных напрямую из TMDB (облегченные)
router.get('/trending', trendingController.getTrendingSeries);
router.get('/trending/tmdb', trendingController.getTrendingSeriesFromTMDB);

router.get('/search', seriesController.searchSeries);
router.get('/popular', seriesController.getPopularSeries);
router.get('/in-production', seriesController.getInProductionSeries);
router.post('/exclude/:id', excludeContentController);

// Маршруты с параметрами
router.get('/genre/:genreId', seriesController.getSeriesByGenre);
router.get('/:id', seriesController.getSeriesById);

// Маршруты для сезонов и эпизодов
router.get('/:seriesId/seasons', seriesController.getSeriesSeasons);
router.get('/seasons/:seasonId/episodes', seriesController.getSeasonEpisodes);

export default router;