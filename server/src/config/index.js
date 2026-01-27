import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Определяем текущую директорию (для ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env файл из корня проекта
dotenv.config({ path: join(__dirname, '../../.env') });

const config = {
    // Настройки приложения
    app: {
        host: process.env.HOST || '127.0.0.1',
        port: parseInt(process.env.PORT, 10) || 5000, // исправил POST на PORT
        env: process.env.NODE_ENV || 'development'
    },

    // Настройки базы данных
    database: {
        username: process.env.DB_USER|| 'root',
        password: process.env.DB_PASSWORD || '',
        host: process.env.DB_HOST || 'localhost',
        name: process.env.DB_NAME || 'mydatabase',
        // Собираем строку подключения для удобства
        get connectionString() {
            return `mysql://${this.username}:${this.password}@${this.host}/${this.name}`;
        }
    },

    // API ключи
    tmdb: {
        apiKey: process.env.TMDB_API_KEY || '',
        apiToken: process.env.TMDB_API_TOKEN || '',
        baseUrl: 'http://files.tmdb.org/p/exports',
        userAgent: 'TMDB-Downloader/1.0',
        movieAPIUrl: 'https://api.themoviedb.org/3/movie',
        tvAPIUrl: 'https://api.themoviedb.org/3/tv',
    },

    // Прокси настройки
    proxy: {
        type: process.env.PROXY_TYPE || 'socks5',
        host: process.env.PROXY_HOST || '127.0.0.1',
        port: parseInt(process.env.PROXY_PORT, 10) || 20170,
        username: process.env.PROXY_USERNAME || '',
        password: process.env.PROXY_PASSWORD || '',
        enabled: process.env.PROXY_ENABLED === 'true' || false,
        timeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
        retryCount : parseInt(process.env.PROXY_RETRY_COUNT) || 3,

        // Геттер для формирования URL прокси
        get url() {
            if (!this.enabled) return null;
            if (this.username && this.password) {
                return `${this.type}://${this.username}:${this.password}@${this.host}:${this.port}`;
            }
            return `${this.type}://${this.host}:${this.port}`;
        }
    },

    // Пути
    paths: {
        downloads: join(__dirname, '../../tmdb_downloads'),
        logs: join(__dirname, '../../logs')
    },

    // Валидация конфигурации
    validate() {
        const required = [
            'DB_USERNAME',
            'DB_HOST',
            'DB_NAME'
        ];

        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Отсутствуют обязательные переменные окружения: ${missing.join(', ')}`);
        }
    },

    // Проверка, работает ли в production режиме
    get isProduction() {
        return this.app.env === 'production';
    },

    get isDevelopment() {
        return this.app.env === 'development';
    }
};

// Вызываем валидацию при импорте (если нужно)
// config.validate();

export default config;