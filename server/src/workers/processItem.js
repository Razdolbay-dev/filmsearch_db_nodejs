// workers/processItem.js
import { MovieImportService } from '../services/movieImportService.js';
import { SeriesImportService } from '../services/seriesImportService.js';
import { pool } from '../config/database.js';

export async function processItem(jobId, item, wsServer) {
    const { tmdb_id, item_type } = item;

    // Создаём сервис
    const service = item_type === 'movie'
        ? new MovieImportService()
        : new SeriesImportService();

    let connection = null;

    try {
        // Получаем соединение из пула
        connection = await pool.getConnection();

        // *** ВАЖНО: Передаём существующее соединение в сервис ***
        // Сервис проверит this.connection и НЕ будет создавать новое
        service.connection = connection;

        // Отправляем статус "начало обработки"
        if (wsServer) {
            wsServer.broadcastJobUpdate(jobId, {
                event: 'item:started',
                tmdbId: tmdb_id,
                type: item_type,
                message: `Начинаю импорт ${item_type === 'movie' ? 'фильма' : 'сериала'} ${tmdb_id}`
            });
        }

        // Вызываем ТВОЙ метод импорта - он использует наше соединение!
        let result;
        if (item_type === 'movie') {
            result = await service.fetchAndStoreMovie(tmdb_id);
        } else {
            result = await service.importSeriesById(tmdb_id);
        }

        // Дальше логика успеха/ошибки...
        if (result.success) {
            // Сохраняем в sync_processed_items
            await connection.execute(`
                INSERT INTO sync_processed_items
                    (tmdb_id, item_type, status, job_id, processed_at)
                VALUES (?, ?, 'completed', ?, NOW())
                    ON DUPLICATE KEY UPDATE
                                         status = 'completed',
                                         job_id = VALUES(job_id),
                                         processed_at = NOW()
            `, [tmdb_id, item_type, jobId]);

            // Обновляем очередь
            await connection.execute(`
                UPDATE sync_queue
                SET status = 'completed', processed_at = NOW()
                WHERE job_id = ? AND tmdb_id = ? AND item_type = ?
            `, [jobId, tmdb_id, item_type]);

            if (wsServer) {
                wsServer.broadcastJobUpdate(jobId, {
                    event: 'item:completed',
                    tmdbId: tmdb_id,
                    type: item_type,
                    title: result.title || result.seriesName,
                    message: `✅ Импортирован: ${result.title || result.seriesName}`
                });
            }

            return { success: true, tmdb_id, title: result.title || result.seriesName };

        } else {
            // Логика для пропущенных (не Released, дата в будущем и т.д.)
            await connection.execute(`
                INSERT INTO sync_processed_items
                    (tmdb_id, item_type, status, job_id, processed_at)
                VALUES (?, ?, 'skipped', ?, NOW())
            `, [tmdb_id, item_type, jobId]);

            await connection.execute(`
                UPDATE sync_queue
                SET status = 'skipped',
                    error_message = ?,
                    processed_at = NOW()
                WHERE job_id = ? AND tmdb_id = ? AND item_type = ?
            `, [result.reason || 'Пропущено по условиям', jobId, tmdb_id, item_type]);

            if (wsServer) {
                wsServer.broadcastJobUpdate(jobId, {
                    event: 'item:skipped',
                    tmdbId: tmdb_id,
                    type: item_type,
                    reason: result.reason,
                    message: `⏭️ Пропущен: ${result.reason || 'не соответствует критериям'}`
                });
            }

            return { success: false, skipped: true, tmdb_id, reason: result.reason };
        }

    } catch (error) {
        console.error(`❌ Ошибка импорта ${item_type} ${tmdb_id}:`, error.message);

        if (connection) {
            // Логируем ошибку
            await connection.execute(`
                INSERT INTO sync_processed_items
                    (tmdb_id, item_type, status, job_id, processed_at)
                VALUES (?, ?, 'failed', ?, NOW())
            `, [tmdb_id, item_type, jobId]);

            await connection.execute(`
                UPDATE sync_queue
                SET status = 'failed',
                    error_message = ?,
                    attempts = attempts + 1,
                    last_attempt = NOW()
                WHERE job_id = ? AND tmdb_id = ? AND item_type = ?
            `, [error.message.slice(0, 500), jobId, tmdb_id, item_type]);
        }

        if (wsServer) {
            wsServer.broadcastJobUpdate(jobId, {
                event: 'item:failed',
                tmdbId: tmdb_id,
                type: item_type,
                error: error.message,
                message: `❌ Ошибка: ${error.message}`
            });
        }

        return { success: false, tmdb_id, error: error.message };

    } finally {
        // *** КРИТИЧЕСКИ ВАЖНО: Очищаем connection у сервиса ***
        // Чтобы сервис не закрыл его в disconnect()
        if (service.connection) {
            service.connection = null;
        }

        // Возвращаем соединение в пул
        if (connection) {
            connection.release();
        }
    }
}