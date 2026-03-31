import { pool } from '../config/database.js';
import { excludeContent } from '../services/mainService.js';

async function getSeriesIds() {
    const connection = await pool.getConnection();

    try {
        // Выполняем запрос
        const [rows] = await connection.execute(`
            select * from tv_series where published = 0 and overview is null and first_air_date < '2024-01-01' and name not REGEXP '[а-яА-ЯёЁ]'
        `);

        // Получаем только id
        const ids = rows.map(row => row.id);

        console.log('Всего ТВ-Шоу/сериалов:', ids.length);

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

// Функция для обработки с ограничением параллелизма
async function processWithConcurrencyLimit(seriesIds, concurrencyLimit = 5) {
    if (!seriesIds || seriesIds.length === 0) {
        console.log('Нет сериалов для обработки');
        return {
            success: [],
            failed: [],
            skipped: []
        };
    }

    console.log(`Начинаем обработку ${seriesIds.length} сериалов с параллельностью ${concurrencyLimit}...`);

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    let activePromises = 0;
    let currentIndex = 0;

    return new Promise((resolve) => {
        const processNext = async () => {
            if (currentIndex >= seriesIds.length) {
                if (activePromises === 0) {
                    printResults(seriesIds.length, results);
                    resolve(results);
                }
                return;
            }

            const index = currentIndex++;
            const id = seriesIds[index];
            activePromises++;

            try {
                console.log(`[${index + 1}/${seriesIds.length}] Обработка сериала ID: ${id}`);

                const result = await excludeContent(id, 'series');

                if (result.success) {
                    results.success.push({ id, message: result.message });
                    console.log(`✅ Успешно: ${result.message}`);
                } else {
                    // Проверяем, не потому ли ошибка, что сериал уже в исключениях
                    if (result.message.includes('уже в списке исключений')) {
                        results.skipped.push({ id, message: result.message });
                        console.log(`⏭️ Пропущен: ${result.message}`);
                    } else {
                        results.failed.push({ id, message: result.message });
                        console.log(`❌ Ошибка: ${result.message}`);
                    }
                }
            } catch (error) {
                results.failed.push({ id, message: error.message });
                console.log(`❌ Критическая ошибка: ${error.message}`);
            } finally {
                activePromises--;

                // Добавляем небольшую задержку между запросами, чтобы не перегружать БД
                await new Promise(resolve => setTimeout(resolve, 100));

                processNext();
            }
        };

        // Запускаем начальные задачи (не больше, чем concurrencyLimit)
        for (let i = 0; i < Math.min(concurrencyLimit, seriesIds.length); i++) {
            processNext();
        }
    });
}

function printResults(total, results) {
    console.log('\n=== РЕЗУЛЬТАТЫ ОБРАБОТКИ ===');
    console.log(`Всего обработано: ${total}`);
    console.log(`✅ Успешно: ${results.success.length}`);
    console.log(`⏭️ Пропущено (уже в исключениях): ${results.skipped.length}`);
    console.log(`❌ Ошибок: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ Список ошибок:');
        results.failed.forEach(f => console.log(`  ID ${f.id}: ${f.message}`));
    }
}

// Вызываем функцию
const seriesIds = await getSeriesIds();
// Использование - можно изменить количество параллельных запросов (например, 10)
const results = await processWithConcurrencyLimit(seriesIds, 100);