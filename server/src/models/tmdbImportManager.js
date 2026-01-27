import { pool, initializeDatabase } from '../config/database.js';
import fs from 'fs';
import zlib from 'zlib';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Утилиты
const gunzip = promisify(zlib.gunzip);

class TMDBImportManager {
    constructor() {
        this.connection = null;
    }

    /**
     * Инициализирует базу данных и создает таблицы если нужно
     */
    async initialize() {
        try {
            // Инициализируем базу данных
            await initializeDatabase();

            console.log('✅ База данных и таблицы готовы');
        } catch (error) {
            console.error('❌ Ошибка инициализации базы данных:', error.message);
            throw error;
        }
    }

    /**
     * Читает и парсит gzip файл экспорта
     */
    async readExportFile(filePath) {
        try {
            console.log(`📖 Чтение файла: ${path.basename(filePath)}`);

            const compressedData = await fs.promises.readFile(filePath);
            const jsonBuffer = await gunzip(compressedData);
            const jsonString = jsonBuffer.toString('utf-8');

            // Файл содержит JSON объекты по одной строке
            const lines = jsonString.trim().split('\n');
            const data = lines.map(line => JSON.parse(line));

            console.log(`📊 Прочитано записей: ${data.length}`);
            return data;
        } catch (error) {
            console.error(`❌ Ошибка чтения файла ${filePath}:`, error.message);
            throw error;
        }
    }

    /**
     * Импортирует фильмы с фильтрацией по популярности (>= 1) и исключением adult
     */
    async importMovies(filePath, exportDate) {
        let connection;
        try {
            connection = await pool.getConnection();

            const movies = await this.readExportFile(filePath);

            // Фильтруем по популярности >= 1 и non-adult
            const filteredMovies = movies.filter(movie =>
                movie.popularity >= 1.0 &&
                movie.adult === false
            );

            console.log(`🎬 Фильтровано записей: ${filteredMovies.length} (из ${movies.length})`);

            if (filteredMovies.length === 0) {
                console.log('⚠️  Нет фильмов для импорта после фильтрации');
                return { total: 0, imported: 0 };
            }

            // Подготавливаем данные для вставки
            const values = filteredMovies.map(movie => [
                movie.id,
                movie.original_title || null,
                movie.popularity || 0.0,
                movie.video || false,
                movie.adult || false,
                exportDate
            ]);

            // Вставляем данные с игнорированием дубликатов
            const [result] = await connection.query(`
                INSERT IGNORE INTO tmdb_export_movies 
                (tmdb_id, original_title, popularity, video, adult, export_date)
                VALUES ?
            `, [values]);

            console.log(`✅ Импортировано фильмов: ${result.affectedRows}`);

            return {
                total: movies.length,
                filtered: filteredMovies.length,
                imported: result.affectedRows
            };

        } catch (error) {
            console.error('❌ Ошибка импорта фильмов:', error.message);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * Импортирует TV сериалы с фильтрацией по популярности (>= 1)
     */
    async importTVSeries(filePath, exportDate) {
        let connection;
        try {
            connection = await pool.getConnection();

            const tvSeries = await this.readExportFile(filePath);

            // Фильтруем по популярности >= 1
            const filteredTV = tvSeries.filter(tv =>
                tv.popularity >= 1.0
            );

            console.log(`📺 Фильтровано записей: ${filteredTV.length} (из ${tvSeries.length})`);

            if (filteredTV.length === 0) {
                console.log('⚠️  Нет сериалов для импорта после фильтрации');
                return { total: 0, imported: 0 };
            }

            // Подготавливаем данные для вставки
            const values = filteredTV.map(tv => [
                tv.id,
                tv.original_name || null,
                tv.popularity || 0.0,
                exportDate
            ]);

            // Вставляем данные с игнорированием дубликатов
            const [result] = await connection.query(`
                INSERT IGNORE INTO tmdb_export_tv 
                (tmdb_id, original_name, popularity, export_date)
                VALUES ?
            `, [values]);

            console.log(`✅ Импортировано сериалов: ${result.affectedRows}`);

            return {
                total: tvSeries.length,
                filtered: filteredTV.length,
                imported: result.affectedRows
            };

        } catch (error) {
            console.error('❌ Ошибка импорта сериалов:', error.message);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * Импортирует коллекции (без фильтрации)
     */
    async importCollections(filePath, exportDate) {
        let connection;
        try {
            connection = await pool.getConnection();

            const collections = await this.readExportFile(filePath);

            console.log(`📦 Всего коллекций: ${collections.length}`);

            if (collections.length === 0) {
                console.log('⚠️  Нет коллекций для импорта');
                return { total: 0, imported: 0 };
            }

            // Подготавливаем данные для вставки
            const values = collections.map(collection => [
                collection.id,
                collection.name || '',
                exportDate
            ]);

            // Вставляем данные с игнорированием дубликатов
            const [result] = await connection.query(`
                INSERT IGNORE INTO tmdb_export_collection 
                (tmdb_id, name, export_date)
                VALUES ?
            `, [values]);

            console.log(`✅ Импортировано коллекций: ${result.affectedRows}`);

            return {
                total: collections.length,
                imported: result.affectedRows
            };

        } catch (error) {
            console.error('❌ Ошибка импорта коллекций:', error.message);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * Основная функция импорта
     */
    async importAllExports(exportDate, downloadsDir = 'downloads') {
        const dateStr = exportDate.replaceAll('-', '_');
        const baseName = `${downloadsDir}`;

        const files = {
            movies: path.join(baseName, `movie_ids_${dateStr}.json.gz`),
            tv: path.join(baseName, `tv_series_ids_${dateStr}.json.gz`),
            collections: path.join(baseName, `collection_ids_${dateStr}.json.gz`)
        };

        console.log(`🚀 Начало импорта данных за ${exportDate}`);
        console.log('='.repeat(50));

        // Инициализируем базу данных
        await this.initialize();

        const results = {};

        try {
            // Проверяем существование файлов
            for (const [type, filePath] of Object.entries(files)) {
                if (!fs.existsSync(filePath)) {
                    console.error(`❌ Файл не найден: ${filePath}`);
                }
            }

            // Импортируем данные
            if (fs.existsSync(files.movies)) {
                console.log('\n🎬 Импорт фильмов...');
                results.movies = await this.importMovies(files.movies, exportDate);
            }

            if (fs.existsSync(files.tv)) {
                console.log('\n📺 Импорт TV сериалов...');
                results.tv = await this.importTVSeries(files.tv, exportDate);
            }

            if (fs.existsSync(files.collections)) {
                console.log('\n📦 Импорт коллекций...');
                results.collections = await this.importCollections(files.collections, exportDate);
            }

            // Сводка
            this.printImportSummary(results);

            return {
                success: true,
                date: exportDate,
                results: results,
                summary: this.calculateSummary(results)
            };

        } catch (error) {
            console.error('💥 Ошибка импорта:', error.message);
            return {
                success: false,
                error: error.message,
                date: exportDate
            };
        }
    }

    /**
     * Выводит сводку импорта
     */
    printImportSummary(results) {
        console.log('\n' + '='.repeat(50));
        console.log('📊 СВОДКА ИМПОРТА:');

        let totalImported = 0;
        let totalFiltered = 0;
        let totalRecords = 0;

        for (const [type, result] of Object.entries(results)) {
            if (result) {
                const typeName = type === 'movies' ? 'Фильмы' :
                    type === 'tv' ? 'Сериалы' : 'Коллекции';

                console.log(`${typeName}:`);
                console.log(`  Всего записей: ${result.total}`);

                if (result.filtered !== undefined) {
                    console.log(`  После фильтрации: ${result.filtered}`);
                    totalFiltered += result.filtered;
                }

                console.log(`  Импортировано: ${result.imported}`);
                totalImported += result.imported;
                totalRecords += result.total;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`📈 Всего импортировано: ${totalImported} записей`);

        if (totalRecords > 0) {
            const percentage = (totalImported / totalRecords * 100).toFixed(1);
            console.log(`🎯 Эффективность фильтрации: ${totalImported}/${totalRecords} (${percentage}%)`);
        }
    }

    /**
     * Рассчитывает итоговую статистику
     */
    calculateSummary(results) {
        let totalImported = 0;
        let totalRecords = 0;

        for (const result of Object.values(results)) {
            if (result) {
                totalImported += result.imported || 0;
                totalRecords += result.total || 0;
            }
        }

        return {
            totalImported,
            totalRecords,
            efficiency: totalRecords > 0 ? (totalImported / totalRecords).toFixed(3) : 0
        };
    }

    /**
     * Получает статистику по импортированным данным
     */
    async getImportStats(exportDate = null) {
        let connection;
        try {
            connection = await pool.getConnection();

            let whereClause = '';
            if (exportDate) {
                whereClause = `WHERE export_date = '${exportDate}'`;
            }

            const queries = {
                movies: `SELECT COUNT(*) as count, AVG(popularity) as avg_popularity FROM tmdb_export_movies ${whereClause}`,
                tv: `SELECT COUNT(*) as count, AVG(popularity) as avg_popularity FROM tmdb_export_tv ${whereClause}`,
                collections: `SELECT COUNT(*) as count FROM tmdb_export_collection ${whereClause}`
            };

            const stats = {};

            for (const [type, query] of Object.entries(queries)) {
                const [rows] = await connection.query(query);
                stats[type] = rows[0];
            }

            console.log('\n📊 Статистика базы данных:');
            console.table([
                {
                    Тип: 'Фильмы',
                    Количество: stats.movies.count,
                    'Ср. популярность': parseFloat(stats.movies.avg_popularity || 0).toFixed(2)
                },
                {
                    Тип: 'Сериалы',
                    Количество: stats.tv.count,
                    'Ср. популярность': parseFloat(stats.tv.avg_popularity || 0).toFixed(2)
                },
                {
                    Тип: 'Коллекции',
                    Количество: stats.collections.count,
                    'Ср. популярность': '-'
                }
            ]);

            return stats;

        } catch (error) {
            console.error('❌ Ошибка получения статистики:', error.message);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    /**
     * Очищает данные за указанную дату
     */
    async clearImportData(exportDate) {
        let connection;
        try {
            connection = await pool.getConnection();

            console.log(`🗑️  Очистка данных за ${exportDate}...`);

            const tables = ['tmdb_export_movies', 'tmdb_export_tv', 'tmdb_export_collection'];
            let totalDeleted = 0;

            for (const table of tables) {
                const [result] = await connection.query(
                    `DELETE FROM ${table} WHERE export_date = ?`,
                    [exportDate]
                );
                console.log(`  ${table}: удалено ${result.affectedRows} записей`);
                totalDeleted += result.affectedRows;
            }

            console.log(`✅ Всего удалено: ${totalDeleted} записей`);

            return { success: true, deleted: totalDeleted };

        } catch (error) {
            console.error('❌ Ошибка очистки данных:', error.message);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
}

/**
 * Определяет дату для экспорта
 */
function getExportDate() {
    const now = new Date();
    const isBefore1PM = now.getHours() < 13;
    const exportDate = new Date(now);

    if (isBefore1PM) {
        exportDate.setDate(exportDate.getDate() - 1);
    }

    return exportDate.toISOString().split('T')[0];
}

function formatDateToMM_DD_YYYY(dateStr) {
    // dateStr в формате "2026_01_27"
    const [year, month, day] = dateStr.split('_');
    return `${month}_${day}_${year}`;
}

/**
 * Основная функция для запуска скрипта

async function main() {
    const importManager = new TMDBImportManager();

    // Получаем дату для импорта
    const exportDate = getExportDate();
    const dateStrUnderscore = exportDate.replace(/-/g, '_');

    console.log(`📅 Импорт данных за: ${exportDate}`);

    // Проверяем файлы
    const downloadsDir = 'downloads';
    const requiredFiles = [
        `movie_ids_${dateStrUnderscore}.json.gz`,
        `tv_series_ids_${dateStrUnderscore}.json.gz`,
        `collection_ids_${dateStrUnderscore}.json.gz`
    ];

    console.log('\n🔍 Проверка файлов:');
    let allFilesExist = true;

    for (const file of requiredFiles) {
        const filePath = path.join(downloadsDir, file);
        const exists = fs.existsSync(filePath);
        console.log(`${exists ? '✅' : '❌'} ${file}`);
        if (!exists) allFilesExist = false;
    }

    if (!allFilesExist) {
        console.log('\n⚠️  Не все файлы найдены. Сначала скачайте файлы экспорта.');
        return;
    }

    // Запускаем импорт
    const result = await importManager.importAllExports(exportDate);

    // Показываем статистику
    if (result.success) {
        console.log('\n📈 Финальная статистика:');
        await importManager.getImportStats(exportDate);

        console.log('\n✨ Импорт завершен успешно!');
    } else {
        console.error('\n💥 Импорт завершен с ошибкой');
    }
}

// Запуск скрипта
if (import.meta.url === new URL(import.meta.url).href) {
    main().catch(console.error);
}
 */

export { TMDBImportManager, getExportDate, formatDateToMM_DD_YYYY };