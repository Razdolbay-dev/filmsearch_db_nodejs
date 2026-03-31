// workers/syncWorker.js
import { pool } from '../config/database.js';
import { processItem } from './processItem.js';
import { getWsServer } from '../websocket/index.js';

export async function startSyncJob(jobId, type = 'movies', filters = {}) {
    console.log(`🚀 [Job ${jobId}] Запуск синхронизации ${type}`);

    let connection = null;

    try {
        connection = await pool.getConnection();

        // *** ПРОВЕРКА: Не запущен ли уже воркер? ***
        const [existing] = await connection.execute(
            'SELECT status FROM sync_jobs WHERE id = ?',
            [jobId]
        );

        if (existing.length === 0) {
            throw new Error(`Задача ${jobId} не найдена`);
        }

        // Если задача уже running и не stopped/failed - не запускаем второй раз
        if (existing[0].status === 'running') {
            console.log(`⚠️ [Job ${jobId}] Задача уже выполняется, пропускаем запуск`);
            return;
        }

        // Обновляем статус на running
        await connection.execute(`
            UPDATE sync_jobs
            SET status = 'running',
                started_at = COALESCE(started_at, NOW()),
                completed_at = NULL,
                error_message = NULL
            WHERE id = ?
        `, [jobId]);
        
        console.log(`✅ [Job ${jobId}] Статус обновлен на 'running'`);

        // 2. Получаем список ID для импорта
        console.log(`🔍 [Job ${jobId}] Получаем список ID из таблицы экспорта...`);
        const items = await getItemsToSync(connection, type, filters);

        if (!items || items.length === 0) {
            console.log(`⚠️ [Job ${jobId}] Нет элементов для импорта!`);

            // Завершаем задачу, если нечего импортировать
            await connection.execute(`
                UPDATE sync_jobs 
                SET status = 'completed', 
                    total_items = 0,
                    completed_at = NOW()
                WHERE id = ?
            `, [jobId]);

            const wsServer = getWsServer();
            if (wsServer) {
                wsServer.broadcastJobUpdate(jobId, {
                    event: 'completed',
                    message: 'Нет новых элементов для импорта'
                });
            }

            return;
        }

        const totalItems = items.length;
        console.log(`✅ [Job ${jobId}] Найдено ${totalItems} элементов для импорта`);
        console.log(`📊 [Job ${jobId}] Первые 5 ID:`, items.slice(0, 5).map(i => i.tmdb_id));

        // Обновляем total_items
        await connection.execute(`
            UPDATE sync_jobs SET total_items = ? WHERE id = ?
        `, [totalItems, jobId]);

        // Получаем WebSocket сервер
        const wsServer = getWsServer();

        if (wsServer) {
            wsServer.broadcastJobUpdate(jobId, {
                event: 'started',
                total: totalItems,
                message: `Начинаю синхронизацию ${totalItems} ${type === 'movies' ? 'фильмов' : 'сериалов'}`
            });
        }

        // 3. Обрабатываем батчами
        const BATCH_SIZE = 20;
        let processedCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            // Проверяем статус задачи
            const [jobStatus] = await connection.execute(
                'SELECT status FROM sync_jobs WHERE id = ?',
                [jobId]
            );

            if (!jobStatus || jobStatus.length === 0) {
                console.log(`❌ [Job ${jobId}] Задача не найдена в БД`);
                break;
            }

            const currentStatus = jobStatus[0].status;
            console.log(`📌 [Job ${jobId}] Текущий статус: ${currentStatus}`);

            if (currentStatus === 'stopped') {
                console.log(`🛑 [Job ${jobId}] Задача остановлена пользователем`);
                if (wsServer) {
                    wsServer.broadcastJobUpdate(jobId, {
                        event: 'stopped',
                        message: 'Синхронизация остановлена пользователем'
                    });
                }
                break;
            }

            // Если на паузе - ждём
            while (currentStatus === 'paused') {
                console.log(`⏸️ [Job ${jobId}] Задача на паузе, ожидание...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                const [updated] = await connection.execute(
                    'SELECT status FROM sync_jobs WHERE id = ?',
                    [jobId]
                );
                jobStatus[0].status = updated[0].status;
            }

            const batch = items.slice(i, i + BATCH_SIZE);
            console.log(`📦 [Job ${jobId}] Обработка батча ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(items.length/BATCH_SIZE)} (${batch.length} элементов)`);

            // Добавляем элементы в очередь
            for (const item of batch) {
                try {
                    await connection.execute(`
                        INSERT INTO sync_queue (job_id, tmdb_id, item_type, status)
                        VALUES (?, ?, ?, 'pending')
                        ON DUPLICATE KEY UPDATE 
                            status = 'pending', 
                            attempts = 0, 
                            error_message = NULL,
                            last_attempt = NULL
                    `, [jobId, item.tmdb_id, type === 'movies' ? 'movie' : 'series']);
                } catch (queueError) {
                    console.error(`❌ [Job ${jobId}] Ошибка добавления в очередь:`, queueError.message);
                }
            }

            // Обрабатываем батч

            for (const item of batch) {
                try {
                    // Обновляем текущий ID
                    await connection.execute(`
                        UPDATE sync_jobs SET current_item_id = ? WHERE id = ?
                    `, [item.tmdb_id, jobId]);

                    console.log(`🔄 [Job ${jobId}] Обработка ${type === 'movies' ? 'фильма' : 'сериала'} ID: ${item.tmdb_id}...`);

                    // Обрабатываем элемент
                    const result = await processItem(jobId, {
                        tmdb_id: item.tmdb_id,
                        item_type: type === 'movies' ? 'movie' : 'series',
                        title: item.title || item.original_title || item.original_name,
                        popularity: item.popularity
                    }, wsServer);

                    // Увеличиваем общий счетчик обработанных
                    processedCount++;

                    // Увеличиваем специфические счетчики
                    if (result.success) {
                        // Успешно - ничего дополнительно не делаем
                        console.log(`✅ [Job ${jobId}] Успешно обработан ID: ${item.tmdb_id}`);
                    } else if (result.skipped) {
                        skippedCount++;
                        console.log(`⏭️ [Job ${jobId}] Пропущен ID: ${item.tmdb_id} - ${result.reason}`);
                    } else {
                        failedCount++;
                        console.log(`❌ [Job ${jobId}] Ошибка обработки ID: ${item.tmdb_id} - ${result.error}`);
                    }

                    // *** СОХРАНЯЕМ ВСЕ СЧЕТЧИКИ В БД ПОСЛЕ КАЖДОГО ЭЛЕМЕНТА ***
                    await connection.execute(`
            UPDATE sync_jobs 
            SET processed_items = ?,
                failed_items = ?,
                skipped_items = ?
            WHERE id = ?
        `, [processedCount, failedCount, skippedCount, jobId]);

                    // Отправляем прогресс
                    const percentage = Math.round((processedCount / totalItems) * 100);

                    if (wsServer) {
                        wsServer.broadcastJobUpdate(jobId, {
                            event: 'progress',
                            processed: processedCount,
                            total: totalItems,
                            percentage,
                            currentId: item.tmdb_id,
                            stats: {
                                completed: processedCount - failedCount - skippedCount,
                                failed: failedCount,
                                skipped: skippedCount
                            }
                        });
                    }

                    // Задержка между запросами
                    await new Promise(resolve => setTimeout(resolve, 250));

                } catch (itemError) {
                    console.error(`❌ [Job ${jobId}] Критическая ошибка обработки элемента ${item.tmdb_id}:`, itemError);

                    // В случае критической ошибки тоже обновляем счетчики
                    processedCount++;
                    failedCount++;

                    await connection.execute(`
            UPDATE sync_jobs 
            SET processed_items = ?,
                failed_items = ?
            WHERE id = ?
        `, [processedCount, failedCount, jobId]);
                }
            }
        }

        // 4. Завершаем задачу
        console.log(`🏁 [Job ${jobId}] Синхронизация завершена. Обработано: ${processedCount}, Ошибок: ${failedCount}, Пропущено: ${skippedCount}`);

        await connection.execute(`
            UPDATE sync_jobs
            SET status = 'completed',
                completed_at = NOW()
            WHERE id = ?
        `, [jobId]);

        if (wsServer) {
            wsServer.broadcastJobUpdate(jobId, {
                event: 'completed',
                processed: processedCount,
                failed: failedCount,
                skipped: skippedCount,
                message: `✅ Синхронизация завершена. Импортировано: ${processedCount}, Пропущено: ${skippedCount}, Ошибок: ${failedCount}`
            });
        }

    } catch (error) {
        console.error(`❌ [Job ${jobId}] КРИТИЧЕСКАЯ ОШИБКА СИНХРОНИЗАЦИИ:`, error);
        console.error(error.stack);

        if (connection) {
            try {
                await connection.execute(`
                    UPDATE sync_jobs 
                    SET status = 'failed', 
                        error_message = ?,
                        completed_at = NOW()
                    WHERE id = ?
                `, [error.message.slice(0, 500), jobId]);
            } catch (dbError) {
                console.error(`❌ [Job ${jobId}] Не удалось обновить статус ошибки в БД:`, dbError);
            }
        }

        const wsServer = getWsServer();
        if (wsServer) {
            wsServer.broadcastJobUpdate(jobId, {
                event: 'failed',
                error: error.message,
                message: `❌ Ошибка: ${error.message}`
            });
        }

    } finally {
        if (connection) {
            connection.release();
            console.log(`🔌 [Job ${jobId}] Соединение с БД освобождено`);
        }
    }
}

async function getItemsToSync(connection, type, filters) {
    console.log(`🔍 getItemsToSync: type=${type}, filters=`, filters);

    const exportTable = type === 'movies' ? 'tmdb_export_movies' : 'tmdb_export_tv';
    const mainTable = type === 'movies' ? 'movies' : 'tv_series';
    const titleField = type === 'movies' ? 'title' : 'name';
    const popularityField = 'popularity';
    const nameField = type === 'movies' ? 'original_title' : 'original_name';
    const mediaType = type === 'movies' ? 'movie' : 'series';

    // Константы для пакетной обработки
    const BATCH_SIZE = 10000; // Размер пакета для запросов
    const MAX_PLACEHOLDERS = 60000; // Безопасный лимит плейсхолдеров

    try {
        // 1. Получаем ID из экспорта с популярностью > порога
        let exportQuery = `
            SELECT tmdb_id, ${nameField} as title, ${popularityField} as popularity
            FROM ${exportTable}
            WHERE ${popularityField} > ?
        `;
        const exportParams = [filters.popularity || 1.0];

        if (type === 'movies' && filters.adult === false) {
            exportQuery += ` AND adult = 0`;
        }

        exportQuery += ` ORDER BY ${popularityField} DESC`;

        const [exportItems] = await connection.execute(exportQuery, exportParams);
        console.log(`📊 В экспорте: ${exportItems.length} элементов`);

        if (exportItems.length === 0) {
            return [];
        }

        // 2. Получаем ID исключенного контента
        const [excludedItems] = await connection.execute(
            `SELECT tmdb_id FROM content_exclusions 
             WHERE media_type = ?`,
            [mediaType]
        );

        const excludedIds = new Set(excludedItems.map(item => item.tmdb_id));
        console.log(`🚫 Исключенных ID: ${excludedIds.size}`);

        // 3. Фильтруем экспортные элементы, исключая запрещенные
        const filteredExportItems = exportItems.filter(
            item => !excludedIds.has(item.tmdb_id)
        );
        console.log(`📊 После фильтрации исключений: ${filteredExportItems.length} элементов`);

        if (filteredExportItems.length === 0) {
            return [];
        }

        // 4. Получаем ID для обновления с учетом даты
        const updateThreshold = filters.daysThreshold || 7;

        const [itemsToUpdate] = await connection.execute(`
            SELECT id, updated_at
            FROM ${mainTable}
            WHERE overview IS NULL 
              AND ${titleField} IS NOT NULL 
              AND ${titleField} != '' 
              AND ${titleField} NOT REGEXP '[а-яА-ЯёЁ]'
              AND (
                  updated_at IS NULL 
                  OR updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
              )
        `, [updateThreshold]);

        const updateIds = new Set(itemsToUpdate.map(item => item.id));
        console.log(`📊 Требуют обновления (не обновлялись ${updateThreshold}+ дней): ${updateIds.size} ID`);

        // 5. Получаем существующие ID из основной таблицы ПАКЕТАМИ
        const allTmdbIds = filteredExportItems.map(item => item.tmdb_id);
        const existingIds = new Set();

        // Разбиваем ID на пакеты
        const idBatches = [];
        for (let i = 0; i < allTmdbIds.length; i += BATCH_SIZE) {
            idBatches.push(allTmdbIds.slice(i, i + BATCH_SIZE));
        }

        console.log(`📦 Разбиваем на ${idBatches.length} пакетов по ~${BATCH_SIZE} ID`);

        // Обрабатываем каждый пакет
        for (let i = 0; i < idBatches.length; i++) {
            const batch = idBatches[i];
            const placeholders = batch.map(() => '?').join(',');

            const [existingBatch] = await connection.execute(
                `SELECT id FROM ${mainTable} WHERE id IN (${placeholders})`,
                batch
            );

            existingBatch.forEach(item => existingIds.add(item.id));

            if ((i + 1) % 10 === 0) {
                console.log(`   Обработано ${i + 1}/${idBatches.length} пакетов`);
            }
        }

        console.log(`✅ Найдено существующих ID: ${existingIds.size}`);

        // 6. Разделяем элементы
        const newItems = [];
        const updateItems = [];

        for (const item of filteredExportItems) {
            if (updateIds.has(item.tmdb_id)) {
                updateItems.push(item);
            } else if (!existingIds.has(item.tmdb_id)) {
                newItems.push(item);
            }
        }

        console.log(`🆕 Новых: ${newItems.length}, 🔄 На обновление: ${updateItems.length}`);

        // 7. Формируем результат
        const result = [...newItems, ...updateItems].sort((a, b) => b.popularity - a.popularity);

        // Опциональное ограничение количества
        const finalResult = filters.limit ? result.slice(0, filters.limit) : result;
        console.log(`✅ Result: ${result.length} элементов`);
        console.log(`✅ ИТОГО к синхронизации: ${finalResult.length} элементов`);
        if (excludedIds.size > 0) {
            console.log(`🚫 Пропущено из-за исключений: ${exportItems.length - filteredExportItems.length}`);
        }

        return finalResult;

    } catch (error) {
        console.error(`❌ Ошибка:`, error);
        throw error;
    }
}