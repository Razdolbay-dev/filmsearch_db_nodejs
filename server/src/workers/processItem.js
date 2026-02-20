// workers/processItem.js
import { MovieImportService } from '../services/movieImportService.js';
import { SeriesImportService } from '../services/seriesImportService.js';
import { pool } from '../config/database.js';

export async function processItem(jobId, item, wsServer) {
    const { tmdb_id, item_type } = item;

    const service = item_type === 'movie'
        ? new MovieImportService()
        : new SeriesImportService();

    let connection = null;

    try {
        connection = await pool.getConnection();
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

        // Вызываем ТВОЙ метод импорта
        let result;
        if (item_type === 'movie') {
            result = await service.fetchAndStoreMovie(tmdb_id);
        } else {
            result = await service.importSeriesById(tmdb_id);
        }

        // *** ВАЖНО: Проверяем результат ***
        if (result.success) {
            // УСПЕХ: фильм реально импортирован
            await upsertProcessedItem(connection, {
                tmdb_id,
                item_type,
                status: 'completed',
                jobId
            });

            if (wsServer) {
                wsServer.broadcastJobUpdate(jobId, {
                    event: 'item:completed',
                    tmdbId: tmdb_id,
                    type: item_type,
                    title: result.title || result.seriesName,
                    message: `✅ Импортирован: ${result.title || result.seriesName}`
                });
            }

            return { success: true, tmdb_id };

        } else if (result.reason) {
            // ФИЛЬМ НЕ ПРОШЁЛ ПРОВЕРКУ (статус Planned, дата в будущем и т.д.)
            // Это НЕ ошибка, а просто пропуск - используем INSERT IGNORE или ON DUPLICATE SKIP

            // Вариант 1: Всё равно логируем как skipped (с обработкой дубликатов)
            await connection.execute(`
                INSERT INTO sync_processed_items 
                    (tmdb_id, item_type, status, job_id, processed_at)
                VALUES (?, ?, 'skipped', ?, NOW())
                ON DUPLICATE KEY UPDATE
                    status = 'skipped',
                    job_id = VALUES(job_id),
                    processed_at = NOW()
            `, [tmdb_id, item_type, jobId]);

            return { success: false, skipped: true, tmdb_id, reason: result.reason };

        } else {
            // РЕАЛЬНАЯ ОШИБКА (сеть, API, БД) - логируем как failed
            await upsertProcessedItem(connection, {
                tmdb_id,
                item_type,
                status: 'failed',
                jobId,
                error: result.error
            });

            if (wsServer) {
                wsServer.broadcastJobUpdate(jobId, {
                    event: 'item:failed',
                    tmdbId: tmdb_id,
                    type: item_type,
                    error: result.error,
                    message: `❌ Ошибка: ${result.error}`
                });
            }

            return { success: false, tmdb_id, error: result.error };
        }

    } catch (error) {
        // Неожиданная ошибка в самом processItem
        console.error(`❌ [processItem] Критическая ошибка:`, error);

        if (connection) {
            await upsertProcessedItem(connection, {
                tmdb_id,
                item_type,
                status: 'failed',
                jobId,
                error: error.message
            });
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

        throw error; // Пробрасываем дальше, чтобы syncWorker знал о проблеме

    } finally {
        if (service.connection) {
            service.connection = null;
        }
        if (connection) {
            connection.release();
        }
    }
}

// Вспомогательная функция для upsert с обработкой дубликатов
async function upsertProcessedItem(connection, { tmdb_id, item_type, status, jobId, error = null }) {
    await connection.execute(`
        INSERT INTO sync_processed_items 
            (tmdb_id, item_type, status, job_id, processed_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            job_id = VALUES(job_id),
            processed_at = NOW()
    `, [tmdb_id, item_type, status, jobId]);

    // Также обновляем sync_queue
    await connection.execute(`
        UPDATE sync_queue 
        SET status = ?, 
            processed_at = NOW(),
            error_message = ?
        WHERE job_id = ? AND tmdb_id = ? AND item_type = ?
    `, [status, error ? error.slice(0, 500) : null, jobId, tmdb_id, item_type]);
}
