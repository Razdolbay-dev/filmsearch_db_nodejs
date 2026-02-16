import express from 'express';
import movieController from '../controllers/movieController.js';
import { validateMovieId, validateLanguage } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/movies/status
 * @desc    Проверить статус API TMDB
 * @access  Public
 */
router.get('/status', movieController.getApiStatus);

/**
 * @route   GET /api/movies/proxy-info
 * @desc    Получить информацию о прокси
 * @access  Public
 */
router.get('/proxy-info', movieController.getProxyInfo);

/**
 * @route   GET /api/movies/search
 * @desc    Поиск фильмов по названию
 * @query   query - поисковый запрос
 * @query   language - язык (по умолчанию ru-RU)
 * @query   page - страница (по умолчанию 1)
 * @access  Public
 */
router.get('/search', movieController.searchMovies);

/**
 * @route   GET /api/movies/batch/multiple
 * @desc    Получить несколько фильмов
 * @query   ids - ID фильмов через запятую
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/batch/multiple', movieController.getMultipleMovies);

/**
 * @route   GET /api/movies/:id
 * @desc    Получить детали фильма
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id', validateMovieId, validateLanguage, movieController.getMovieDetails);

/**
 * @route   GET /api/movies/:id/full
 * @desc    Получить детали фильма с актерским составом
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id/full', validateMovieId, validateLanguage, movieController.getMovieWithCredits);

/**
 * @route   GET /api/movies/:id/credits
 * @desc    Получить актерский состав фильма
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id/credits', validateMovieId, validateLanguage, movieController.getMovieCredits);

export default router;