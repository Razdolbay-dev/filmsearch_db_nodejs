import express from 'express';
import infoController from '../controllers/infoController.js';

const router = express.Router();

/**
 * @route   GET /api/info
 * @desc    Полная информация о всех доступных API endpoint с примерами
 * @access  Public
 */
router.get('/', infoController.getApiInfo);

/**
 * @route   GET /api/info/service
 * @desc    Краткая информация о сервисе
 * @access  Public
 */
router.get('/service', infoController.getServiceInfo);

export default router;