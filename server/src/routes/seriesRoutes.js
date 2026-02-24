import { Router } from 'express';
import SeriesController from '../controllers/seriesController.js';

const router = Router();
const seriesController = new SeriesController();

// Базовые маршруты
router.get('/', seriesController.getAllSeries);
router.get('/search', seriesController.searchSeries);
router.get('/popular', seriesController.getPopularSeries);
router.get('/in-production', seriesController.getInProductionSeries);

// Маршруты с параметрами
router.get('/genre/:genreId', seriesController.getSeriesByGenre);
router.get('/:id', seriesController.getSeriesById);

// Маршруты для сезонов и эпизодов
router.get('/:seriesId/seasons', seriesController.getSeriesSeasons);
router.get('/seasons/:seasonId/episodes', seriesController.getSeasonEpisodes);

export default router;