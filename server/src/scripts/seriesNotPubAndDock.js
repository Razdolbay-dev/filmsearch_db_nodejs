import { pool } from '../config/database.js';
import { excludeContent } from '../services/mainService.js';

async function getSeriesIds() {
    const connection = await pool.getConnection();

    try {
        // Поиск по дате
        // SELECT id, name, original_name, first_air_date from tv_series
        // where poster_path is null and first_air_date < '2020-01-01'

        // Выполняем запрос
        const [rows] = await connection.execute(`
            SELECT id, name, original_name, first_air_date from tv_series
            where poster_path is null and first_air_date < '2020-01-01'
        `);

        // Получаем только id
        const ids = rows.map(row => row.id);

        console.log('Все ID:', ids);
        console.log('Количество ТВ-Шоу/сериалов:', ids.length);

        return ids;

    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release(); // Возвращаем соединение в pool
        }
    }
}

async function processAllSeriesSequential(seriesIds) {
    if (!seriesIds || seriesIds.length === 0) {
        console.log('Нет фильмов для обработки');
        return {
            success: [],
            failed: [],
            skipped: []
        };
    }

    console.log(`Начинаем обработку ${seriesIds.length} фильмов...`);

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    for (let i = 0; i < seriesIds.length; i++) {
        const id = seriesIds[i];

        try {
            console.log(`[${i + 1}/${seriesIds.length}] Обработка фильма ID: ${id}`);

            const result = await excludeContent(id, 'series');

            if (result.success) {
                results.success.push({ id, message: result.message });
                console.log(`✅ Успешно: ${result.message}`);
            } else {
                // Проверяем, не потому ли ошибка, что фильм уже в исключениях
                if (result.message.includes('уже в списке исключений')) {
                    results.skipped.push({ id, message: result.message });
                    console.log(`⏭️ Пропущен: ${result.message}`);
                } else {
                    results.failed.push({ id, message: result.message });
                    console.log(`❌ Ошибка: ${result.message}`);
                }
            }

            // Небольшая задержка между запросами, чтобы не перегружать БД
            if (i < seriesIds.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

        } catch (error) {
            results.failed.push({ id, message: error.message });
            console.log(`❌ Критическая ошибка: ${error.message}`);
        }
    }

    // Выводим статистику
    console.log('\n=== РЕЗУЛЬТАТЫ ОБРАБОТКИ ===');
    console.log(`Всего обработано: ${seriesIds.length}`);
    console.log(`✅ Успешно: ${results.success.length}`);
    console.log(`⏭️ Пропущено (уже в исключениях): ${results.skipped.length}`);
    console.log(`❌ Ошибок: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ Список ошибок:');
        results.failed.forEach(f => console.log(`  ID ${f.id}: ${f.message}`));
    }

    return results;
}

// Вызываем функцию
const seriesIds = await getSeriesIds();
// Использование
const results = await processAllSeriesSequential(seriesIds);
