import express from 'express';
import seriesController from '../controllers/seriesController.js';

import {
    validateSeriesId,
    validateSeasonNumber,
    validateEpisodeNumber,
} from '../middleware/seriesValidation.js';

import {
    validateLanguage
} from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/series/status
 * @desc    Проверить статус TV API
 * @access  Public
 */
router.get('/status', seriesController.getApiStatus);

/**
 * @route   GET /api/series/search
 * @desc    Поиск сериалов
 * @query   query - поисковый запрос
 * @query   language - язык (по умолчанию ru-RU)
 * @query   page - страница (по умолчанию 1)
 * @access  Public
 */
router.get('/search', seriesController.searchSeries);

/**
 * @route   GET /api/series/popular
 * @desc    Популярные сериалы
 * @query   language - язык (по умолчанию ru-RU)
 * @query   page - страница (по умолчанию 1)
 * @access  Public
 */
router.get('/popular', seriesController.getPopularSeries);

/**
 * @route   GET /api/series/on-the-air
 * @desc    Сериалы в эфире
 * @query   language - язык (по умолчанию ru-RU)
 * @query   page - страница (по умолчанию 1)
 * @access  Public
 */
router.get('/on-the-air', seriesController.getOnTheAirSeries);

/**
 * @route   GET /api/series/:id
 * @desc    Получить детали сериала
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id', validateSeriesId, validateLanguage, seriesController.getSeriesDetails);

/**
 * @route   GET /api/series/:id/full
 * @desc    Полная информация о сериале с расширенными опциями
 * @query   language - язык (по умолчанию ru-RU)
 * @query   includeSeasons - включать сезоны (true/false, по умолчанию true)
 * @query   includeEpisodes - включать эпизоды (true/false, по умолчанию true)
 * @query   includeFullEpisodes - включать полную информацию об эпизодах (true/false, по умолчанию false)
 * @query   maxConcurrent - максимальное количество параллельных запросов (1-20, по умолчанию 5)
 * @query   includeCredits - включать актерский состав (по умолчанию true)
 * @query   includeRecommendations - включать рекомендации (по умолчанию true)
 * @query   includeSimilar - включать похожие сериалы (по умолчанию false)
 * @query   includeContentRatings - включать рейтинги (по умолчанию true)
 * @query   includeVideos - включать видео (по умолчанию false)
 * @query   includeKeywords - включать ключевые слова (по умолчанию false)
 * @query   includeReviews - включать обзоры (по умолчанию false)
 * @query   includeWatchProviders - включать информацию о стриминге (по умолчанию false)
 * @access  Public
 */
router.get('/:id/full', validateSeriesId, validateLanguage, seriesController.getFullSeriesInfo);

/**
 * @route   GET /api/series/:id/credits
 * @desc    Актерский состав сериала
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id/credits', validateSeriesId, validateLanguage, seriesController.getSeriesCredits);

/**
 * @route   GET /api/series/:id/seasons
 * @desc    Все сезоны сериала
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id/seasons', validateSeriesId, validateLanguage, seriesController.getAllSeasons);

/**
 * @route   GET /api/series/:id/similar
 * @desc    Похожие сериалы
 * @query   language - язык (по умолчанию ru-RU)
 * @query   page - страница (по умолчанию 1)
 * @access  Public
 */
router.get('/:id/similar', validateSeriesId, validateLanguage, seriesController.getSimilarSeries);

/**
 * @route   GET /api/series/:id/seasons-with-episodes
 * @desc    Получить все сезоны с эпизодами
 * @query   language - язык (по умолчанию ru-RU)
 * @query   includeFullEpisodes - включать полную информацию об эпизодах (true/false, по умолчанию false)
 * @access  Public
 */
router.get('/:id/seasons-with-episodes', seriesController.getAllSeasonsWithEpisodes);

/**
 * @route   GET /api/series/:id/season/:seasonNumber/full-episodes
 * @desc    Получить сезон с полной информацией об эпизодах
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id/season/:seasonNumber/full-episodes', seriesController.getSeasonWithFullEpisodes);




/**
 * @route   GET /api/series/:id/season/:seasonNumber
 * @desc    Детали сезона
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id/season/:seasonNumber', validateSeriesId,
    validateSeasonNumber,
    validateLanguage,
    seriesController.getSeasonDetails
);

/**
 * @route   GET /api/series/:id/season/:seasonNumber/full
 * @desc    Полная информация о сезоне (с актерами)
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id/season/:seasonNumber/full', validateSeriesId,
    validateSeasonNumber,
    validateLanguage,
    seriesController.getFullSeason
);

/**
 * @route   GET /api/series/:id/season/:seasonNumber/episodes
 * @desc    Все эпизоды сезона
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id/season/:seasonNumber/episodes', validateSeriesId,
    validateSeasonNumber,
    validateLanguage,
    seriesController.getAllEpisodes
);

/**
 * @route   GET /api/series/:id/season/:seasonNumber/episode/:episodeNumber
 * @desc    Детали эпизода
 * @query   language - язык (по умолчанию ru-RU)
 * @access  Public
 */
router.get('/:id/season/:seasonNumber/episode/:episodeNumber', validateSeriesId,
    validateSeasonNumber,
    validateEpisodeNumber,
    validateLanguage,
    seriesController.getEpisodeDetails
);

export default router;