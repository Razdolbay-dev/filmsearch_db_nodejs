// routes/torznab.routes.js
import express from 'express';
import torznabController from '../controllers/torznabController.js';

const router = express.Router();

/**
 * @route   POST /api/torznab/search
 * @desc    Поиск торрентов через Torznab
 * @access  Public
 * @body    { query, title, original_title, year, release_date }
 */
router.post('/search', (req, res, next) => {
    // Добавляем время начала запроса для health check
    req.startTime = Date.now();
    next();
}, torznabController.search);

/**
 * @route   GET /api/torznab/info/:id
 * @desc    Получение информации о торренте
 * @access  Public
 * @params  id - ID торрента
 * @query   link - ссылка на торрент
 */
router.get('/info/:id', torznabController.getTorrentInfo);

/**
 * @route   GET /api/torznab/health
 * @desc    Проверка доступности Torznab сервера
 * @access  Public
 */
router.get('/health', (req, res, next) => {
    req.startTime = Date.now();
    next();
}, torznabController.healthCheck);

/**
 * @route   GET /api/torznab/stats
 * @desc    Получение статистики поиска
 * @access  Public
 */
router.get('/stats', torznabController.getStats);

export default router;