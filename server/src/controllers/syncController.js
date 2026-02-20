import { pool } from '../config/database.js';
import { startSyncJob } from '../workers/syncWorker.js';
import { getWsServer } from '../websocket/index.js';

class SyncController {
    /**
     * @route   POST /api/sync/movies
     * @desc    Запуск синхронизации фильмов
     * @access  Private (нужно добавить middleware)
     */
    async syncMovies(req, res) {
        let connection = null;

        try {
            const {
                limit = 1000,           // Максимум фильмов для импорта
                popularity = 1.0,       // Минимальная популярность
                adult = false          // Исключить взрослые
            } = req.body;

            connection = await pool.getConnection();

            // 1. Создаём задачу в БД
            const [result] = await connection.execute(`
            INSERT INTO sync_jobs 
            (job_name, job_type, status, total_items, metadata)
            VALUES (?, 'movies', 'pending', 0, ?)
        `, [
                `Синхронизация фильмов ${new Date().toLocaleString('ru-RU')}`,
                JSON.stringify({ limit, popularity, adult, startedBy: req.ip })
            ]);

            const jobId = result.insertId;

            // 2. Отправляем ответ сразу
            res.json({
                success: true,
                jobId,
                message: 'Задача синхронизации фильмов создана',
                status: 'pending'
            });

            // 3. Запускаем синхронизацию асинхронно
            setImmediate(() => {
                startSyncJob(jobId, 'movies', { limit, popularity, adult })
                    .catch(error => {
                        console.error(`❌ Ошибка в задаче ${jobId}:`, error);
                    });
            });

        } catch (error) {
            console.error('Ошибка создания задачи синхронизации фильмов:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * @route   POST /api/sync/series
     * @desc    Запуск синхронизации сериалов
     */
    async syncSeries(req, res) {
        let connection = null;

        try {
            const {
                limit = 500,            // Сериалов обычно меньше
                popularity = 1.0,
                includeEpisodes = true // Импортировать эпизоды
            } = req.body;

            connection = await pool.getConnection();

            const [result] = await connection.execute(`
            INSERT INTO sync_jobs 
            (job_name, job_type, status, total_items, metadata)
            VALUES (?, 'series', 'pending', 0, ?)
        `, [
                `Синхронизация сериалов ${new Date().toLocaleString('ru-RU')}`,
                JSON.stringify({ limit, popularity, includeEpisodes, startedBy: req.ip })
            ]);

            const jobId = result.insertId;

            res.json({
                success: true,
                jobId,
                message: 'Задача синхронизации сериалов создана',
                status: 'pending'
            });

            setImmediate(() => {
                startSyncJob(jobId, 'series', { limit, popularity, includeEpisodes })
                    .catch(error => {
                        console.error(`❌ Ошибка в задаче ${jobId}:`, error);
                    });
            });

        } catch (error) {
            console.error('Ошибка создания задачи синхронизации сериалов:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * @route   GET /api/sync/jobs
     * @desc    Получение списка всех задач синхронизации
     */
    async getJobs(req, res) {
        let connection = null;

        try {
            connection = await pool.getConnection();

            const [jobs] = await connection.execute(`
            SELECT 
                id,
                job_name,
                job_type,
                status,
                total_items,
                processed_items,
                failed_items,
                skipped_items,
                started_at,
                completed_at,
                created_at,
                error_message,
                metadata
            FROM sync_jobs
            ORDER BY created_at DESC
            LIMIT 50
        `);

            // Добавляем прогресс в процентах
            const jobsWithProgress = jobs.map(job => ({
                ...job,
                progress: job.total_items > 0
                    ? Math.round((job.processed_items / job.total_items) * 100)
                    : 0,
                metadata: job.metadata ? JSON.parse(job.metadata) : null
            }));

            res.json({
                success: true,
                jobs: jobsWithProgress
            });

        } catch (error) {
            console.error('Ошибка получения списка задач:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * @route   GET /api/sync/job/:jobId
     * @desc    Получение статуса конкретной задачи
     */
    async getJobByID(req, res) {
        let connection = null;

        try {
            const jobId = req.params.jobId;
            connection = await pool.getConnection();

            // Получаем задачу
            const [jobs] = await connection.execute(`
                SELECT * FROM sync_jobs WHERE id = ?
            `, [jobId]);

            if (jobs.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Задача не найдена'
                });
            }

            const job = jobs[0];

            // *** ВАЖНО: Получаем реальную статистику из processed_items ***
            const [stats] = await connection.execute(`
                SELECT
                    status,
                    COUNT(*) as count
                FROM sync_processed_items
                WHERE job_id = ?
                GROUP BY status
            `, [jobId]);

            const statusStats = {
                completed: 0,
                failed: 0,
                skipped: 0
            };

            stats.forEach(row => {
                statusStats[row.status] = row.count;
            });

            // Получаем последние 10 обработанных элементов
            const [recentItems] = await connection.execute(`
                SELECT tmdb_id, item_type, status, processed_at
                FROM sync_processed_items
                WHERE job_id = ?
                ORDER BY processed_at DESC
                    LIMIT 10
            `, [jobId]);

            // Отправляем клиенту
            res.json({
                success: true,
                job: {
                    id: job.id,
                    job_name: job.job_name,
                    job_type: job.job_type,
                    status: job.status,
                    total_items: job.total_items,
                    // Используем реальные счетчики из статистики
                    processed_items: statusStats.completed + statusStats.failed + statusStats.skipped,
                    failed_items: statusStats.failed,
                    skipped_items: statusStats.skipped,
                    // Успешные вычисляем как completed
                    completed_items: statusStats.completed,
                    started_at: job.started_at,
                    completed_at: job.completed_at,
                    error_message: job.error_message,
                    metadata: job.metadata ? JSON.parse(job.metadata) : null,
                    progress: job.total_items > 0
                        ? Math.round(((statusStats.completed + statusStats.failed + statusStats.skipped) / job.total_items) * 100)
                        : 0,
                    recentItems
                }
            });

        } catch (error) {
            console.error(`Ошибка получения задачи ${req.params.jobId}:`, error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * @route   POST /api/sync/job/:jobId/:action
     * @desc    Управление задачей (pause/resume/stop)
     */
    async editJobActionByID(req, res) {
        let connection = null;

        try {
            const { jobId, action } = req.params;
            const validActions = ['pause', 'resume', 'stop'];

            if (!validActions.includes(action)) {
                return res.status(400).json({
                    success: false,
                    error: 'Допустимые действия: pause, resume, stop'
                });
            }

            connection = await pool.getConnection();

            // Получаем текущую задачу
            const [jobs] = await connection.execute(
                'SELECT * FROM sync_jobs WHERE id = ?',
                [jobId]
            );

            if (jobs.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Задача не найдена'
                });
            }

            const job = jobs[0];
            let newStatus;

            switch (action) {
                case 'pause':
                    newStatus = 'paused';
                    break;
                case 'resume':
                    newStatus = 'running';
                    break;
                case 'stop':
                    newStatus = 'stopped';
                    break;
            }

            // Обновляем статус в БД
            await connection.execute(
                'UPDATE sync_jobs SET status = ? WHERE id = ?',
                [newStatus, jobId]
            );

            // *** ВАЖНО: Если задача была stopped/completed/failed и мы делаем resume ***
            // Нужно запустить новый воркер!
            if (action === 'resume' && ['stopped', 'failed', 'completed'].includes(job.status)) {
                console.log(`🔄 [Job ${jobId}] Перезапуск задачи из статуса ${job.status}`);

                // Сбрасываем счётчики? Опционально
                if (job.status === 'failed' || job.status === 'stopped') {
                    await connection.execute(`
                    UPDATE sync_jobs 
                    SET processed_items = 0,
                        failed_items = 0,
                        skipped_items = 0,
                        current_item_id = NULL,
                        completed_at = NULL,
                        error_message = NULL
                    WHERE id = ?
                `, [jobId]);
                }

                // Запускаем новый воркер асинхронно
                const jobType = job.job_type;
                const filters = job.metadata ? JSON.parse(job.metadata) : {};

                setImmediate(() => {
                    import('../workers/syncWorker.js').then(({ startSyncJob }) => {
                        startSyncJob(jobId, jobType, filters)
                            .catch(error => {
                                console.error(`❌ [Job ${jobId}] Ошибка перезапуска:`, error);
                            });
                    });
                });
            }

            // Отправляем WebSocket уведомление
            const wsServer = getWsServer();
            wsServer.broadcastJobUpdate(jobId, {
                event: 'job:status:changed',
                status: newStatus,
                action,
                message: `Задача ${action === 'pause' ? 'приостановлена' :
                    action === 'resume' ? 'возобновлена' : 'остановлена'}`
            });

            res.json({
                success: true,
                jobId,
                status: newStatus,
                message: `Задача успешно ${action === 'pause' ? 'приостановлена' :
                    action === 'resume' ? 'возобновлена' : 'остановлена'}`
            });

        } catch (error) {
            console.error(`Ошибка ${req.params.action} задачи ${req.params.jobId}:`, error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * @route   DELETE /api/sync/job/:jobId
     * @desc    Удаление задачи и её данных
     */
    async deleteJobByID(req, res) {
        let connection = null;

        try {
            const jobId = req.params.jobId;
            connection = await pool.getConnection();

            await connection.beginTransaction();

            // Удаляем связанные данные
            await connection.execute('DELETE FROM sync_queue WHERE job_id = ?', [jobId]);
            await connection.execute('DELETE FROM sync_processed_items WHERE job_id = ?', [jobId]);
            await connection.execute('DELETE FROM sync_progress WHERE sync_id = ?', [`job_${jobId}`]);
            await connection.execute('DELETE FROM sync_jobs WHERE id = ?', [jobId]);

            await connection.commit();

            res.json({
                success: true,
                message: 'Задача и все связанные данные удалены'
            });

        } catch (error) {
            if (connection) await connection.rollback();
            console.error(`Ошибка удаления задачи ${req.params.jobId}:`, error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        } finally {
            if (connection) connection.release();
        }
    }
}

// Экспортируем экземпляр контроллера
const syncController = new SyncController();
export default syncController;