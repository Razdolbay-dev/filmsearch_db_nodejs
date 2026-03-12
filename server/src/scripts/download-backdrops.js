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
        url: process.env.PROXY_URL || '',
        timeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
        retryCount: parseInt(process.env.PROXY_RETRY_COUNT) || 3,
        retryDelay: parseInt(process.env.PROXY_RETRY_DELAY) || 2000,
        rotate: process.env.PROXY_ROTATE === 'true' || false,
        proxyList: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : []
    },
    dirs: {
        base: '/opt/filmsearch_db_nodejs/server/src/img',
        backdrops: 'backdrops'
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
        this.proxyStats = new Map(); // прокси -> статистика использования
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
        console.log('🔄 Все прокси временно недоступны, сбрасываем счетчики ошибок');
        this.failedProxies.clear();
        return this.config.proxyList[0];
    }

    // Создание агента для прокси
    createProxyAgent(proxyUrl) {
        if (!proxyUrl) return null;

        try {
            // Маскируем пароль в URL для логирования
            const maskedProxy = proxyUrl.replace(/:[^:@]*@/, ':****@');

            if (proxyUrl.startsWith('socks4')) {
                return new SocksProxyAgent(proxyUrl);
            } else if (proxyUrl.startsWith('socks5')) {
                return new SocksProxyAgent(proxyUrl);
            } else {
                return new HttpsProxyAgent(proxyUrl);
            }
        } catch (error) {
            console.error(`❌ Ошибка создания прокси агента:`, error.message);
            return null;
        }
    }

    // Отметить прокси как ошибочный
    markProxyFailed(proxyUrl) {
        if (!proxyUrl) return;

        const failCount = (this.failedProxies.get(proxyUrl) || 0) + 1;
        this.failedProxies.set(proxyUrl, failCount);

        // Обновляем статистику
        const stats = this.proxyStats.get(proxyUrl) || { successes: 0, failures: 0 };
        stats.failures++;
        this.proxyStats.set(proxyUrl, stats);

        const maskedProxy = proxyUrl.replace(/:[^:@]*@/, ':****@');
        console.log(`⚠️ Прокси ${maskedProxy} помечен как ошибочный (ошибок: ${failCount}/3)`);

        if (failCount >= 3) {
            console.log(`❌ Прокси ${maskedProxy} временно исключен из ротации`);
        }
    }

    // Отметить успешное использование прокси
    markProxySuccess(proxyUrl) {
        if (!proxyUrl) return;

        const stats = this.proxyStats.get(proxyUrl) || { successes: 0, failures: 0 };
        stats.successes++;
        this.proxyStats.set(proxyUrl, stats);

        this.failedProxies.delete(proxyUrl);
    }

    // Получить статистику прокси
    getProxyStats() {
        const stats = {};
        for (const [proxy, data] of this.proxyStats) {
            const maskedProxy = proxy.replace(/:[^:@]*@/, ':****@');
            stats[maskedProxy] = data;
        }
        return stats;
    }

    // Проверить доступность прокси
    async testProxy(proxyUrl) {
        if (!proxyUrl) return false;

        try {
            const agent = this.createProxyAgent(proxyUrl);
            if (!agent) return false;

            const testUrl = 'https://api.themoviedb.org/3/configuration';
            const response = await axios({
                method: 'GET',
                url: testUrl,
                httpsAgent: agent,
                proxy: false,
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            return response.status === 200;
        } catch (error) {
            const maskedProxy = proxyUrl.replace(/:[^:@]*@/, ':****@');
            console.log(`⚠️ Прокси ${maskedProxy} не отвечает:`, error.message);
            return false;
        }
    }
}

// Инициализация менеджера прокси
const proxyManager = new ProxyManager(CONFIG.proxy);

// Создание директорий
async function createDirectories() {
    const backdropsDir = path.join(CONFIG.dirs.base, CONFIG.dirs.backdrops);

    try {
        await fs.access(backdropsDir);
    } catch {
        await fs.mkdir(backdropsDir, { recursive: true });
        console.log(`✅ Создана директория: ${backdropsDir}`);
    }

    return { backdropsDir };
}

// Получение списка существующих файлов
async function getExistingFiles(directory) {
    try {
        const files = await fs.readdir(directory);
        return new Set(files);
    } catch (error) {
        console.log('📂 Директория пуста или не существует');
        return new Set();
    }
}

// Скачивание изображения с поддержкой прокси и повторными попытками
async function downloadImageWithProxy(url, filepath, retryCount = 0) {
    const proxyUrl = CONFIG.proxy.enabled
        ? proxyManager.getNextProxy()
        : null;

    const startTime = Date.now();

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
                'Referer': 'https://www.themoviedb.org/',
                'Connection': 'keep-alive'
            },
            maxRedirects: 5,
            validateStatus: function (status) {
                return status >= 200 && status < 300; // Только успешные статусы
            }
        };

        // Добавляем прокси если используется
        if (proxyUrl) {
            const agent = proxyManager.createProxyAgent(proxyUrl);
            if (agent) {
                axiosConfig.httpsAgent = agent;
                axiosConfig.proxy = false; // Отключаем стандартный прокси axios
                const maskedProxy = proxyUrl.replace(/:[^:@]*@/, ':****@');
                console.log(`🔌 [${retryCount > 0 ? `попытка ${retryCount + 1}` : 'загрузка'}] Использую прокси: ${maskedProxy}`);
            } else {
                console.log('⚠️ Не удалось создать прокси агент, пробую без прокси');
            }
        }

        const response = await axios(axiosConfig);

        // Проверяем, что ответ действительно содержит изображение
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error(`Получен неверный Content-Type: ${contentType}`);
        }

        await fs.writeFile(filepath, response.data);

        const downloadTime = Date.now() - startTime;

        // Если успешно скачали через прокси, отмечаем успех
        if (proxyUrl) {
            proxyManager.markProxySuccess(proxyUrl);
            console.log(`✅ Успешно через прокси (${downloadTime}ms): ${path.basename(filepath)}`);
        } else {
            console.log(`✅ Успешно (${downloadTime}ms): ${path.basename(filepath)}`);
        }

        return { success: true, proxyUsed: !!proxyUrl, time: downloadTime };

    } catch (error) {
        const errorInfo = {
            code: error.code,
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText
        };

        // Отмечаем прокси как ошибочный, если ошибка связана с соединением
        if (proxyUrl && (
            error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ECONNREFUSED' ||
            error.code === 'EPROTO' ||
            error.message.includes('socket') ||
            error.message.includes('proxy') ||
            error.message.includes('tunnel') ||
            error.response?.status >= 500 // Серверные ошибки
        )) {
            proxyManager.markProxyFailed(proxyUrl);
        }

        // Логируем ошибку (маскируем прокси)
        const proxyInfo = proxyUrl ? `(прокси: ${proxyUrl.replace(/:[^:@]*@/, ':****@')})` : '(без прокси)';

        if (error.response) {
            console.error(`❌ Ошибка HTTP ${error.response.status}: ${path.basename(filepath)} ${proxyInfo}`);
        } else {
            console.error(`❌ Ошибка: ${error.code || error.message} для ${path.basename(filepath)} ${proxyInfo}`);
        }

        // Повторная попытка если не превышен лимит и ошибка позволяет
        if (retryCount < CONFIG.proxy.retryCount && this.isRetryableError(error)) {
            console.log(`🔄 Повторная попытка ${retryCount + 1}/${CONFIG.proxy.retryCount} для ${path.basename(filepath)}...`);

            // Экспоненциальная задержка
            const delay = CONFIG.proxy.retryDelay * Math.pow(2, retryCount);
            await sleep(delay);

            return downloadImageWithProxy(url, filepath, retryCount + 1);
        }

        return {
            success: false,
            error: errorInfo,
            proxyUsed: !!proxyUrl,
            retryCount
        };
    }
}

// Проверка, можно ли повторить попытку при данной ошибке
function isRetryableError(error) {
    // Ошибки, при которых имеет смысл повторить запрос
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPROTO'];

    return (
        retryableStatusCodes.includes(error.response?.status) ||
        retryableErrors.includes(error.code) ||
        error.message.includes('timeout') ||
        error.message.includes('socket hang up') ||
        error.message.includes('tunnel') ||
        error.message.includes('proxy')
    );
}

// Задержка выполнения
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Скачивание пакета изображений с контролем параллельности
async function downloadBatch(batch, backdropsDir, batchIndex, totalBatches) {
    const results = [];
    const batchStats = {
        downloaded: 0,
        failed: 0,
        viaProxy: 0,
        totalTime: 0,
        retries: 0
    };

    // Разбиваем пакет на более мелкие подгруппы для контроля параллельности
    for (let i = 0; i < batch.length; i += CONFIG.concurrentDownloads) {
        const subBatch = batch.slice(i, i + CONFIG.concurrentDownloads);

        console.log(`   ⚡ Запуск ${subBatch.length} параллельных загрузок...`);

        const subResults = await Promise.allSettled(
            subBatch.map(async (item) => {
                const filename = path.basename(item.backdrop_path);
                const filepath = path.join(backdropsDir, filename);
                const imageUrl = `${CONFIG.imageBaseUrl}${item.backdrop_path}`;

                const result = await downloadImageWithProxy(imageUrl, filepath);

                // Добавляем задержку между запросами если нужно
                if (CONFIG.delay > 0) {
                    await sleep(CONFIG.delay);
                }

                return {
                    filename,
                    success: result.success,
                    proxyUsed: result.proxyUsed,
                    time: result.time || 0,
                    retryCount: result.retryCount || 0
                };
            })
        );

        // Обрабатываем результаты подгруппы
        for (const result of subResults) {
            if (result.status === 'fulfilled') {
                const value = result.value;
                if (value.success) {
                    batchStats.downloaded++;
                    if (value.proxyUsed) batchStats.viaProxy++;
                    batchStats.totalTime += value.time;
                    batchStats.retries += value.retryCount;
                } else {
                    batchStats.failed++;
                }
            } else {
                batchStats.failed++;
            }
        }

        // Показываем прогресс внутри пакета
        const subProgress = Math.min(((i + subBatch.length) / batch.length) * 100, 100);
        console.log(`      Подгруппа завершена: ${subProgress.toFixed(0)}% пакета`);
    }

    return batchStats;
}

// Проверка доступности прокси перед началом работы
async function initializeProxy() {
    if (!CONFIG.proxy.enabled) {
        console.log('ℹ️ Прокси отключен в конфигурации');
        return { success: true, workingProxies: 0 };
    }

    console.log('\n🔍 Проверка подключения к прокси...');

    if (CONFIG.proxy.rotate && CONFIG.proxy.proxyList.length > 0) {
        console.log(`📋 Найдено ${CONFIG.proxy.proxyList.length} прокси для ротации`);

        let workingCount = 0;
        for (let i = 0; i < Math.min(CONFIG.proxy.proxyList.length, 3); i++) {
            const proxy = CONFIG.proxy.proxyList[i];
            const maskedProxy = proxy.replace(/:[^:@]*@/, ':****@');
            console.log(`   Тестируем прокси ${i + 1}: ${maskedProxy}...`);

            const isWorking = await proxyManager.testProxy(proxy);
            if (isWorking) {
                workingCount++;
                console.log(`   ✅ Прокси работает`);
            } else {
                console.log(`   ❌ Прокси не отвечает`);
            }
        }

        console.log(`\n📊 Результат: ${workingCount} из ${Math.min(CONFIG.proxy.proxyList.length, 3)} тестовых прокси работают`);
        return { success: workingCount > 0, workingProxies: workingCount };

    } else if (CONFIG.proxy.url) {
        const maskedProxy = CONFIG.proxy.url.replace(/:[^:@]*@/, ':****@');
        console.log(`📋 Используем прокси: ${maskedProxy}`);

        const isWorking = await proxyManager.testProxy(CONFIG.proxy.url);
        if (isWorking) {
            console.log('✅ Прокси работает');
            return { success: true, workingProxies: 1 };
        } else {
            console.log('⚠️ Прокси не отвечает, но продолжаем без него');
            return { success: false, workingProxies: 0 };
        }
    }

    return { success: false, workingProxies: 0 };
}

// Основная функция
async function downloadBackdrops() {
    console.log('🚀 Начинаем скачивание бэкдропов (только для контента с кириллицей)...');
    console.log('=' .repeat(60));

    let connection;
    const startTime = Date.now();
    const globalStats = {
        totalProcessed: 0,
        downloaded: 0,
        failed: 0,
        viaProxy: 0,
        existing: 0,
        retries: 0,
        totalTime: 0
    };

    try {
        // Инициализация и проверка прокси
        const proxyInit = await initializeProxy();
        if (!proxyInit.success && CONFIG.proxy.enabled) {
            console.log('⚠️ Продолжаем работу без прокси (или с частичной функциональностью)');
        }

        const { backdropsDir } = await createDirectories();

        // Получаем список существующих файлов
        console.log('\n📂 Проверяем существующие файлы...');
        const existingFiles = await getExistingFiles(backdropsDir);
        globalStats.existing = existingFiles.size;
        console.log(`   Найдено ${globalStats.existing} существующих файлов`);

        // Подключение к БД
        console.log('\n🔌 Подключаемся к базе данных...');
        connection = await mysql.createConnection({
            host: CONFIG.db.host,
            user: CONFIG.db.user,
            password: CONFIG.db.password,
            database: CONFIG.db.database
        });
        console.log('✅ Подключение к БД успешно');

        // Получаем все необходимые бэкдропы из БД
        console.log('\n🔍 Получаем список всех бэкдропов из БД...');

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

        console.log(`\n📊 Статистика из БД:`);
        console.log(`   - movies: ${movies.length}`);
        console.log(`   - tv_series: ${tvSeries.length}`);
        console.log(`   Всего записей: ${allItems.length}`);

        // Фильтруем только те, которых нет в папке
        const itemsToDownload = allItems.filter(item => {
            const filename = path.basename(item.backdrop_path);
            return !existingFiles.has(filename);
        });

        console.log(`\n📊 Результат анализа:`);
        console.log(`   ✅ Уже есть: ${globalStats.existing}`);
        console.log(`   ⏳ Нужно скачать: ${itemsToDownload.length}`);

        globalStats.totalProcessed = itemsToDownload.length;

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
        if (CONFIG.proxy.enabled) {
            console.log(`   ⚙️ Режим: ${CONFIG.proxy.rotate ? 'ротация' : 'один прокси'}`);
            console.log(`   🔄 Повторных попыток: ${CONFIG.proxy.retryCount}`);
        }

        // Скачиваем пакетами
        for (let i = 0; i < batches.length; i++) {
            console.log(`\n📥 Пакет ${i + 1}/${batches.length} (${batches[i].length} файлов)...`);
            console.log('-' .repeat(40));

            const batchStats = await downloadBatch(batches[i], backdropsDir, i, batches.length);

            globalStats.downloaded += batchStats.downloaded;
            globalStats.failed += batchStats.failed;
            globalStats.viaProxy += batchStats.viaProxy;
            globalStats.retries += batchStats.retries;
            globalStats.totalTime += batchStats.totalTime;

            // Прогресс
            const progress = ((i + 1) / batches.length * 100).toFixed(1);
            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            const avgTimePerImage = batchStats.downloaded > 0
                ? (batchStats.totalTime / batchStats.downloaded).toFixed(0)
                : 0;

            console.log('-' .repeat(40));
            console.log(`   📊 Итоги пакета:`);
            console.log(`      ✅ Скачано: ${batchStats.downloaded}`);
            console.log(`      ❌ Ошибок: ${batchStats.failed}`);
            console.log(`      🔌 Через прокси: ${batchStats.viaProxy}`);
            console.log(`      ⏱️ Среднее время: ${avgTimePerImage}ms`);
            console.log(`   📈 Общий прогресс: ${progress}%`);
            console.log(`   ⏱️ Прошло: ${elapsed} мин`);

            // Статистика по прокси если есть
            if (CONFIG.proxy.enabled && batchStats.viaProxy > 0) {
                const proxyStats = proxyManager.getProxyStats();
                if (Object.keys(proxyStats).length > 0) {
                    console.log(`   📊 Статистика прокси:`);
                    for (const [proxy, stats] of Object.entries(proxyStats)) {
                        console.log(`      ${proxy}: ✓${stats.successes} ✗${stats.failures}`);
                    }
                }
            }
        }

        const endTime = Date.now();
        const totalTime = ((endTime - startTime) / 1000).toFixed(1);
        const avgTimePerDownloaded = globalStats.downloaded > 0
            ? (globalStats.totalTime / globalStats.downloaded).toFixed(0)
            : 0;

        console.log('\n' + '=' .repeat(60));
        console.log('📊 ИТОГОВАЯ СТАТИСТИКА:');
        console.log('=' .repeat(60));
        console.log(`   ✅ Успешно скачано: ${globalStats.downloaded}`);
        console.log(`   ❌ Ошибок: ${globalStats.failed}`);
        console.log(`   🔌 Через прокси: ${globalStats.viaProxy}`);
        console.log(`   📁 Уже было в папке: ${globalStats.existing}`);
        console.log(`   🔄 Повторных попыток: ${globalStats.retries}`);
        console.log(`   ⏱️ Среднее время загрузки: ${avgTimePerDownloaded}ms`);
        console.log(`   ⏱️ Общее время выполнения: ${totalTime} сек`);
        console.log(`   📊 Всего обработано записей в БД: ${allItems.length}`);

        if (CONFIG.proxy.enabled) {
            console.log('\n📊 Статистика прокси:');
            const proxyStats = proxyManager.getProxyStats();
            if (Object.keys(proxyStats).length > 0) {
                for (const [proxy, stats] of Object.entries(proxyStats)) {
                    const successRate = stats.successes + stats.failures > 0
                        ? ((stats.successes / (stats.successes + stats.failures)) * 100).toFixed(1)
                        : 0;
                    console.log(`   ${proxy}:`);
                    console.log(`      ✅ Успешно: ${stats.successes}`);
                    console.log(`      ❌ Ошибок: ${stats.failures}`);
                    console.log(`      📊 Успешность: ${successRate}%`);
                }
            } else {
                console.log('   Нет данных о использовании прокси');
            }
        }

    } catch (error) {
        console.error('\n❌ Критическая ошибка:', error);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Соединение с БД закрыто');
        }
    }
}

// Запуск с обработкой ошибок
downloadBackdrops().catch(error => {
    console.error('❌ Необработанная ошибка:', error);
    process.exit(1);
});