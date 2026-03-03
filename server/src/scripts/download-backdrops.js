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
        backdrops: 'backdrops'
    },
    imageBaseUrl: 'https://image.tmdb.org/t/p/original',
    delay: 100,
    batchSize: 25
};

async function createDirectories() {
    const backdropsDir = path.join(CONFIG.dirs.base, CONFIG.dirs.backdrops);

    try {
        await fs.access(backdropsDir);
    } catch {
        await fs.mkdir(backdropsDir, { recursive: true });
        console.log(`Создана директория: ${backdropsDir}`);
    }

    return { backdropsDir };
}

async function getExistingFiles(directory) {
    try {
        const files = await fs.readdir(directory);
        return new Set(files);
    } catch (error) {
        console.log('Директория пуста или не существует');
        return new Set();
    }
}

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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadBatch(batch, backdropsDir) {
    const results = await Promise.allSettled(
        batch.map(async (item) => {
            const filename = path.basename(item.backdrop_path);
            const filepath = path.join(backdropsDir, filename);
            const imageUrl = `${CONFIG.imageBaseUrl}${item.backdrop_path}`;

            const success = await downloadImage(imageUrl, filepath);
            await sleep(CONFIG.delay);

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

async function downloadBackdrops() {
    console.log('🚀 Начинаем скачивание бэкдропов (только для контента с кириллицей)...');

    let connection;
    const startTime = Date.now();

    try {
        const { backdropsDir } = await createDirectories();

        console.log('📂 Проверяем существующие файлы...');
        const existingFiles = await getExistingFiles(backdropsDir);
        console.log(`   Найдено ${existingFiles.size} существующих файлов`);

        connection = await mysql.createConnection({
            host: CONFIG.db.host,
            user: CONFIG.db.user,
            password: CONFIG.db.password,
            database: CONFIG.db.database
        });

        console.log('✅ Подключение к БД успешно');

        console.log('🔍 Получаем список всех бэкдропов из БД...');

        const [movies] = await connection.execute(`
      SELECT id, backdrop_path 
      FROM movies 
      WHERE backdrop_path IS NOT NULL 
        AND backdrop_path != ''
        AND overview IS NOT NULL 
        AND overview != '' 
        AND title REGEXP '[а-яА-ЯёЁ]'
    `);

        const [tvSeries] = await connection.execute(`
      SELECT id, backdrop_path 
      FROM tv_series 
      WHERE backdrop_path IS NOT NULL 
        AND backdrop_path != ''
        AND overview IS NOT NULL 
        AND overview != '' 
        AND name REGEXP '[а-яА-ЯёЁ]'
    `);

        const allItems = [...movies, ...tvSeries];

        console.log(`📊 Статистика из БД:`);
        console.log(`   - movies: ${movies.length}`);
        console.log(`   - tv_series: ${tvSeries.length}`);
        console.log(`   Всего записей: ${allItems.length}`);

        const itemsToDownload = allItems.filter(item => {
            const filename = path.basename(item.backdrop_path);
            return !existingFiles.has(filename);
        });

        console.log(`\n📊 Результат анализа:`);
        console.log(`   ✅ Уже есть: ${allItems.length - itemsToDownload.length}`);
        console.log(`   ⏳ Нужно скачать: ${itemsToDownload.length}`);

        if (itemsToDownload.length === 0) {
            console.log('\n✨ Все файлы уже скачаны! Работа завершена.');
            return;
        }

        const batches = [];
        for (let i = 0; i < itemsToDownload.length; i += CONFIG.batchSize) {
            batches.push(itemsToDownload.slice(i, i + CONFIG.batchSize));
        }

        console.log(`\n📦 Разбито на ${batches.length} пакетов по ${CONFIG.batchSize} файлов`);

        let totalDownloaded = 0;
        let totalFailed = 0;

        for (let i = 0; i < batches.length; i++) {
            console.log(`\n📥 Пакет ${i + 1}/${batches.length} (${batches[i].length} файлов)...`);

            const { downloaded, failed } = await downloadBatch(batches[i], backdropsDir);

            totalDownloaded += downloaded;
            totalFailed += failed;

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

downloadBackdrops();