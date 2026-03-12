import mysql from 'mysql2/promise';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

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
    proxy: {
        enabled: process.env.PROXY_ENABLED === 'true' || false,
        url: process.env.PROXY_URL || '', // Например: http://user:pass@host:port или socks5://host:port
        timeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
        retryCount: parseInt(process.env.PROXY_RETRY_COUNT) || 3,
        retryDelay: parseInt(process.env.PROXY_RETRY_DELAY) || 2000,
        rotate: process.env.PROXY_ROTATE === 'true' || false,
        proxyList: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : []
    },
    dirs: {
        base: '/opt/filmsearch_db_nodejs/server/src/img',
        posters: 'posters'
    },
    imageBaseUrl: 'https://image.tmdb.org/t/p/original',
    delay: parseInt(process.env.DOWNLOAD_DELAY) || 100,
    batchSize: parseInt(process.env.BATCH_SIZE) || 25,
    concurrentDownloads: parseInt(process.env.CONCURRENT_DOWNLOADS) || 5
};

// Класс для управления прокси
class ProxyManager {
    constructor(config) {
        this.config = config;
        this.currentProxyIndex = 0;
        this.failedProxies = new Map(); // прокси -> количество ошибок
    }

    // Получение следующего прокси из списка (если включена ротация)
    getNextProxy() {
        if (!this.config.rotate || this.config.proxyList.length === 0) {
            return this.config.url;
        }

        // Пропускаем прокси, которые слишком часто ошибались
        let attempts = 0;
        const maxAttempts = this.config.proxyList.length * 2;

        while (attempts < maxAttempts) {
            const proxy = this.config.proxyList[this.currentProxyIndex];
            this.currentProxyIndex = (this.currentProxyIndex + 1) % this.config.proxyList.length;

            const failCount = this.failedProxies.get(proxy) || 0;
            if (failCount < 3) { // Максимум 3 ошибки на прокси
                return proxy;
            }
        }

        // Если все прокси забракованы, сбрасываем счетчики
        this.failedProxies.clear();
        return this.config.proxyList[0];
    }

    // Создание агента для прокси
    createProxyAgent(proxyUrl) {
        if (!proxyUrl) return null;

        try {
            if (proxyUrl.startsWith('socks')) {
                return new SocksProxyAgent(proxyUrl);
            } else {
                return new HttpsProxyAgent(proxyUrl);
            }
        } catch (error) {
            console.error(`❌ Ошибка создания прокси агента для ${proxyUrl}:`, error.message);
            return null;
        }
    }

    // Отметить прокси как ошибочный
    markProxyFailed(proxyUrl) {
        if (!proxyUrl) return;

        const failCount = (this.failedProxies.get(proxyUrl) || 0) + 1;
        this.failedProxies.set(proxyUrl, failCount);

        console.log(`⚠️ Прокси ${proxyUrl} помечен как ошибочный (ошибок: ${failCount}/3)`);

        if (failCount >= 3) {
            console.log(`❌ Прокси ${proxyUrl} временно исключен из ротации`);
        }
    }

    // Очистить ошибки для прокси
    clearProxyFailures(proxyUrl) {
        if (proxyUrl) {
            this.failedProxies.delete(proxyUrl);
        }
    }
}

// Инициализация менеджера прокси
const proxyManager = new ProxyManager(CONFIG.proxy);

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

// Скачивание изображения с поддержкой прокси и повторными попытками
async function downloadImageWithProxy(url, filepath, retryCount = 0) {
    const proxyUrl = CONFIG.proxy.enabled
        ? proxyManager.getNextProxy()
        : null;

    try {
        const axiosConfig = {
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            timeout: CONFIG.proxy.timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://www.themoviedb.org/'
            }
        };

        // Добавляем прокси если используется
        if (proxyUrl) {
            const agent = proxyManager.createProxyAgent(proxyUrl);
            if (agent) {
                axiosConfig.httpsAgent = agent;
                axiosConfig.proxy = false; // Отключаем стандартный прокси axios
                console.log(`🔌 Использую прокси: ${proxyUrl.replace(/:[^:@]*@/, ':****@')}`);
            }
        }

        const response = await axios(axiosConfig);

        await fs.writeFile(filepath, response.data);

        // Если успешно скачали через прокси, очищаем счетчик ошибок для этого прокси
        if (proxyUrl) {
            proxyManager.clearProxyFailures(proxyUrl);
        }

        return { success: true, proxyUsed: !!proxyUrl };

    } catch (error) {
        // Отмечаем прокси как ошибочный, если ошибка связана с соединением
        if (proxyUrl && (
            error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ECONNREFUSED' ||
            error.message.includes('socket') ||
            error.message.includes('proxy')
        )) {
            proxyManager.markProxyFailed(proxyUrl);
        }

        // Логируем ошибку
        console.error(`❌ Ошибка скачивания ${path.basename(filepath)}:`,
            error.code || error.message,
            proxyUrl ? `(прокси: ${proxyUrl.replace(/:[^:@]*@/, ':****@')})` : ''
        );

        // Повторная попытка если не превышен лимит
        if (retryCount < CONFIG.proxy.retryCount) {
            console.log(`🔄 Повторная попытка ${retryCount + 1}/${CONFIG.proxy.retryCount}...`);

            // Экспоненциальная задержка
            const delay = CONFIG.proxy.retryDelay * Math.pow(2, retryCount);
            await sleep(delay);

            return downloadImageWithProxy(url, filepath, retryCount + 1);
        }

        return { success: false, error: error.message, proxyUsed: !!proxyUrl };
    }
}

// Задержка выполнения
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Скачивание пакета изображений с контролем параллельности
async function downloadBatch(batch, postersDir) {
    const results = [];

    // Разбиваем пакет на более мелкие подгруппы для контроля параллельности
    for (let i = 0; i < batch.length; i += CONFIG.concurrentDownloads) {
        const subBatch = batch.slice(i, i + CONFIG.concurrentDownloads);

        const subResults = await Promise.allSettled(
            subBatch.map(async (item) => {
                const filename = path.basename(item.poster_path);
                const filepath = path.join(postersDir, filename);
                const imageUrl = `${CONFIG.imageBaseUrl}${item.poster_path}`;

                const result = await downloadImageWithProxy(imageUrl, filepath);
                await sleep(CONFIG.delay); // Задержка между запросами

                return {
                    filename,
                    success: result.success,
                    proxyUsed: result.proxyUsed
                };
            })
        );

        results.push(...subResults);
    }

    return results.reduce((acc, result) => {
        if (result.status === 'fulfilled') {
            if (result.value.success) {
                acc.downloaded++;
                if (result.value.proxyUsed) {
                    acc.viaProxy++;
                }
            } else {
                acc.failed++;
            }
        } else {
            acc.failed++;
        }
        return acc;
    }, { downloaded: 0, failed: 0, viaProxy: 0 });
}

// Проверка доступности прокси
async function testProxyConnection() {
    if (!CONFIG.proxy.enabled) {
        console.log('ℹ️ Прокси отключен в конфигурации');
        return true;
    }

    console.log('🔍 Проверка подключения к прокси...');

    try {
        const testUrl = 'https://api.themoviedb.org/3/configuration';
        const result = await downloadImageWithProxy(testUrl, null, 0);

        if (result.success) {
            console.log('✅ Подключение к прокси работает');
            return true;
        } else {
            console.log('⚠️ Прокси не работает, но продолжаем без него');
            return false;
        }
    } catch (error) {
        console.log('⚠️ Ошибка проверки прокси, продолжаем без него');
        return false;
    }
}

// Основная функция
async function downloadPosters() {
    console.log('🚀 Начинаем скачивание постеров (только для контента с кириллицей)...');

    let connection;
    const startTime = Date.now();
    const stats = {
        totalProcessed: 0,
        downloaded: 0,
        failed: 0,
        viaProxy: 0,
        existing: 0
    };

    try {
        // Проверяем прокси перед началом работы
        await testProxyConnection();

        const { postersDir } = await createDirectories();

        // Получаем список существующих файлов
        console.log('📂 Проверяем существующие файлы...');
        const existingFiles = await getExistingFiles(postersDir);
        stats.existing = existingFiles.size;
        console.log(`   Найдено ${stats.existing} существующих файлов`);

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
        console.log(`   ✅ Уже есть: ${stats.existing}`);
        console.log(`   ⏳ Нужно скачать: ${itemsToDownload.length}`);

        stats.totalProcessed = itemsToDownload.length;

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
        console.log(`⚡ Параллельных загрузок: ${CONFIG.concurrentDownloads}`);
        console.log(`🔧 Прокси ${CONFIG.proxy.enabled ? 'включен' : 'отключен'}`);

        // Скачиваем пакетами
        for (let i = 0; i < batches.length; i++) {
            console.log(`\n📥 Пакет ${i + 1}/${batches.length} (${batches[i].length} файлов)...`);

            const { downloaded, failed, viaProxy } = await downloadBatch(batches[i], postersDir);

            stats.downloaded += downloaded;
            stats.failed += failed;
            stats.viaProxy += viaProxy;

            // Прогресс
            const progress = ((i + 1) / batches.length * 100).toFixed(1);
            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            console.log(`   Прогресс: ${progress}% | Скачано: ${stats.downloaded} | Ошибок: ${stats.failed} | Через прокси: ${stats.viaProxy} | Прошло: ${elapsed} мин`);
        }

        const endTime = Date.now();
        const totalTime = ((endTime - startTime) / 1000).toFixed(1);

        console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА:');
        console.log(`   ✅ Скачано: ${stats.downloaded}`);
        console.log(`   ❌ Ошибок: ${stats.failed}`);
        console.log(`   🔌 Через прокси: ${stats.viaProxy}`);
        console.log(`   📁 Уже было: ${stats.existing}`);
        console.log(`   ⏱️ Время выполнения: ${totalTime} сек`);
        console.log(`   📊 Всего обработано записей: ${allItems.length}`);

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Запуск с обработкой ошибок
downloadPosters().catch(console.error);