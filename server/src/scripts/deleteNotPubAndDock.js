import { pool } from '../config/database.js';
import { excludeContent } from '../services/mainService.js';

async function getMovieIds() {
    const connection = await pool.getConnection();

    try {
        const [rows] = await connection.execute(`
            select * from movies where published = 0 and overview is null 
            and release_date < '2024-01-01' and title not REGEXP '[а-яА-ЯёЁ]'
        `);

        const ids = rows.map(row => row.id);

        console.log('Всего фильмов:', ids.length);

        return ids;

    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Функция для обработки с ограничением параллелизма
async function processWithConcurrencyLimit(movieIds, concurrencyLimit = 100) {
    if (!movieIds || movieIds.length === 0) {
        console.log('Нет фильмов для обработки');
        return {
            success: [],
            failed: [],
            skipped: []
        };
    }

    console.log(`Начинаем обработку ${movieIds.length} фильмов с параллельностью ${concurrencyLimit}...`);

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    let processed = 0;
    let activePromises = 0;
    let currentIndex = 0;

    return new Promise((resolve) => {
        const processNext = async () => {
            if (currentIndex >= movieIds.length) {
                if (activePromises === 0) {
                    printResults(movieIds.length, results);
                    resolve(results);
                }
                return;
            }

            const index = currentIndex++;
            const id = movieIds[index];
            activePromises++;

            try {
                console.log(`[${index + 1}/${movieIds.length}] Обработка фильма ID: ${id}`);

                const result = await excludeContent(id, 'movie');

                if (result.success) {
                    results.success.push({ id, message: result.message });
                    console.log(`✅ Успешно: ${result.message}`);
                } else {
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
                processed++;

                // Добавляем задержку между запросами
                await new Promise(resolve => setTimeout(resolve, 100));

                processNext();
            }
        };

        // Запускаем начальные задачи
        for (let i = 0; i < Math.min(concurrencyLimit, movieIds.length); i++) {
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
const movieIds = await getMovieIds();
const results = await processWithConcurrencyLimit(movieIds, 100); // Можно изменить количество параллельных запросов