import mysql from 'mysql2/promise';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'filmsearch_db_nodejs'
    },
    dirs: {
        base: '/opt/filmsearch_db_nodejs/server/src/img',
        posters: 'posters'
    },
    imageBaseUrl: 'https://image.tmdb.org/t/p/original',
    delay: 100,
    batchSize: 25 // Размер пакета для скачивания
};

// Создание директорий
async function createDirectories() {
    const postersDir = path.join(CONFIG.dirs.base, CONFIG.dirs.posters);

    try {
        await fs.access(postersDir);
    } catch {
        await fs.mkdir(postersDir, { recursive: true });
        console.log(`Создана директория: ${postersDir}`);
    }

    return { postersDir };
}

// Получение списка существующих файлов
async function getExistingFiles(directory) {
    try {
        const files = await fs.readdir(directory);
        return new Set(files);
    } catch (error) {
        console.log('Директория пуста или не существует');
        return new Set();
    }
}

// Скачивание изображения
async function downloadImage(url, filepath) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        await fs.writeFile(filepath, response.data);
        return true;
    } catch (error) {
        console.error(`❌ Ошибка скачивания ${url}:`, error.message);
        return false;
    }
}

// Задержка выполнения
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Скачивание пакета изображений
async function downloadBatch(batch, postersDir) {
    const results = await Promise.allSettled(
        batch.map(async (item) => {
            const filename = path.basename(item.poster_path);
            const filepath = path.join(postersDir, filename);
            const imageUrl = `${CONFIG.imageBaseUrl}${item.poster_path}`;

            const success = await downloadImage(imageUrl, filepath);
            await sleep(CONFIG.delay); // Задержка между запросами

            return { filename, success };
        })
    );

    return results.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
            if (result.value.success) {
                acc.downloaded++;
            } else {
                acc.failed++;
            }
        } else {
            acc.failed++;
        }
        return acc;
    }, { downloaded: 0, failed: 0 });
}

// Основная функция
async function downloadPosters() {
    console.log('🚀 Начинаем скачивание постеров (только для контента с кириллицей)...');

    let connection;
    const startTime = Date.now();

    try {
        const { postersDir } = await createDirectories();

        // Получаем список существующих файлов
        console.log('📂 Проверяем существующие файлы...');
        const existingFiles = await getExistingFiles(postersDir);
        console.log(`   Найдено ${existingFiles.size} существующих файлов`);

        connection = await mysql.createConnection({
            host: CONFIG.db.host,
            user: CONFIG.db.user,
            password: CONFIG.db.password,
            database: CONFIG.db.database
        });

        console.log('✅ Подключение к БД успешно');

        // Получаем все необходимые постеры из БД
        console.log('🔍 Получаем список всех постеров из БД...');

        const [movies] = await connection.execute(`
            SELECT id, poster_path
            FROM movies
            WHERE poster_path IS NOT NULL
              AND poster_path != ''
        AND overview IS NOT NULL 
        AND overview != '' 
        AND title REGEXP '[а-яА-ЯёЁ]'
        `);

        const [tvSeries] = await connection.execute(`
      SELECT id, poster_path 
      FROM tv_series 
      WHERE poster_path IS NOT NULL 
        AND poster_path != ''
        AND overview IS NOT NULL 
        AND overview != '' 
        AND name REGEXP '[а-яА-ЯёЁ]'
    `);

        const [tvSeasons] = await connection.execute(`
      SELECT ts.id, ts.poster_path, ts.series_id, ts.season_number
      FROM tv_seasons ts
      INNER JOIN tv_series s ON ts.series_id = s.id
      WHERE ts.poster_path IS NOT NULL 
        AND ts.poster_path != ''
        AND s.overview IS NOT NULL 
        AND s.overview != '' 
        AND s.name REGEXP '[а-яА-ЯёЁ]'
    `);

        // Объединяем все записи
        const allItems = [...movies, ...tvSeries, ...tvSeasons];

        console.log(`📊 Статистика из БД:`);
        console.log(`   - movies: ${movies.length}`);
        console.log(`   - tv_series: ${tvSeries.length}`);
        console.log(`   - tv_seasons: ${tvSeasons.length}`);
        console.log(`   Всего записей: ${allItems.length}`);

        // Фильтруем только те, которых нет в папке
        const itemsToDownload = allItems.filter(item => {
            const filename = path.basename(item.poster_path);
            return !existingFiles.has(filename);
        });

        console.log(`\n📊 Результат анализа:`);
        console.log(`   ✅ Уже есть: ${allItems.length - itemsToDownload.length}`);
        console.log(`   ⏳ Нужно скачать: ${itemsToDownload.length}`);

        if (itemsToDownload.length === 0) {
            console.log('\n✨ Все файлы уже скачаны! Работа завершена.');
            return;
        }

        // Разбиваем на пакеты для скачивания
        const batches = [];
        for (let i = 0; i < itemsToDownload.length; i += CONFIG.batchSize) {
            batches.push(itemsToDownload.slice(i, i + CONFIG.batchSize));
        }

        console.log(`\n📦 Разбито на ${batches.length} пакетов по ${CONFIG.batchSize} файлов`);

        let totalDownloaded = 0;
        let totalFailed = 0;

        // Скачиваем пакетами
        for (let i = 0; i < batches.length; i++) {
            console.log(`\n📥 Пакет ${i + 1}/${batches.length} (${batches[i].length} файлов)...`);

            const { downloaded, failed } = await downloadBatch(batches[i], postersDir);

            totalDownloaded += downloaded;
            totalFailed += failed;

            // Прогресс
            const progress = ((i + 1) / batches.length * 100).toFixed(1);
            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            console.log(`   Прогресс: ${progress}% | Скачано: ${totalDownloaded} | Ошибок: ${totalFailed} | Прошло: ${elapsed} мин`);
        }

        const endTime = Date.now();
        const totalTime = ((endTime - startTime) / 1000).toFixed(1);

        console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА:');
        console.log(`   ✅ Скачано: ${totalDownloaded}`);
        console.log(`   ❌ Ошибок: ${totalFailed}`);
        console.log(`   ⏱️ Время выполнения: ${totalTime} сек`);
        console.log(`   📁 Всего обработано записей: ${allItems.length}`);

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

downloadPosters();