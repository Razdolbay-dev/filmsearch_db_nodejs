import express from 'express';
import syncController from '../controllers/syncController.js';

const router = express.Router();

/**
 * @route   POST /api/sync/movies
 * @desc    Запуск синхронизации фильмов
 * @access  Private (нужно добавить middleware)
 */
router.post('/movies', syncController.syncMovies);

/**
 * @route   POST /api/sync/series
 * @desc    Запуск синхронизации сериалов
 */
router.post('/series', syncController.syncSeries);

/**
 * @route   GET /api/sync/jobs
 * @desc    Получение списка всех задач синхронизации
 */
router.get('/jobs', syncController.getJobs);

/**
 * @route   GET /api/sync/job/:jobId
 * @desc    Получение статуса конкретной задачи
 */
router.get('/job/:jobId', syncController.getJobByID);

/**
 * @route   POST /api/sync/job/:jobId/:action
 * @desc    Управление задачей (pause/resume/stop)
 */
router.post('/job/:jobId/:action', syncController.editJobActionByID);
/**
 * @route   DELETE /api/sync/job/:jobId
 * @desc    Удаление задачи и её данных
 */
router.delete('/job/:jobId', syncController.deleteJobByID);

export default router;