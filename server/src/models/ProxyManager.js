// ProxyManager.js
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import axios from 'axios';
import config from '../config/index.js';

/**
 * Менеджер прокси для HTTP запросов
 */
export class ProxyManager {
    constructor() {
        this.agent = null;
        this.currentProxy = null;
        this.httpClient = null;
        this.initializeAgent();
    }

    /**
     * Инициализирует агент прокси на основе конфигурации
     */
    initializeAgent() {
        // Если прокси отключен в конфигурации
        if (!config.proxy?.enabled) {
            this.agent = null;
            this.currentProxy = null;
            console.log('ℹ️  Прокси отключен в конфигурации');
            return;
        }

        const proxyConfig = config.proxy;

        // Проверяем обязательные параметры
        if (!proxyConfig.host || !proxyConfig.port) {
            console.warn('⚠️  Прокси не настроен: отсутствует host или port');
            this.agent = null;
            this.currentProxy = null;
            return;
        }

        try {
            const proxyUrl = this.buildProxyUrl(proxyConfig);

            // Создаем агент в зависимости от типа прокси
            switch (proxyConfig.type?.toLowerCase()) {
                case 'socks4':
                case 'socks5':
                    this.agent = new SocksProxyAgent(proxyUrl, {
                        timeout: proxyConfig.timeout || 30000
                    });
                    break;

                case 'http':
                case 'https':
                    this.agent = new HttpsProxyAgent(proxyUrl);
                    break;

                default:
                    console.warn(`⚠️  Неизвестный тип прокси: ${proxyConfig.type}, используется HTTP`);
                    this.agent = new HttpsProxyAgent(proxyUrl);
            }

            this.currentProxy = {
                url: proxyUrl,
                type: proxyConfig.type,
                host: proxyConfig.host,
                port: proxyConfig.port,
                auth: !!(proxyConfig.username && proxyConfig.password)
            };

            console.log(`✅ Прокси инициализирован: ${proxyConfig.type}://${proxyConfig.host}:${proxyConfig.port}`);

        } catch (error) {
            console.error('❌ Ошибка инициализации прокси:', error.message);
            this.agent = null;
            this.currentProxy = null;
        }
    }

    /**
     * Строит URL для прокси
     */
    buildProxyUrl(proxyConfig) {
        let authPart = '';

        // Добавляем аутентификацию если есть
        if (proxyConfig.username && proxyConfig.password) {
            authPart = `${encodeURIComponent(proxyConfig.username)}:${encodeURIComponent(proxyConfig.password)}@`;
        }

        return `${proxyConfig.type}://${authPart}${proxyConfig.host}:${proxyConfig.port}`;
    }

    /**
     * Создает и возвращает HTTP клиент с настроенным прокси
     */
    createHttpClient(customConfig = {}) {
        // Если уже есть клиент, возвращаем его
        if (this.httpClient && !customConfig.forceNew) {
            return this.httpClient;
        }

        const defaultConfig = {
            timeout: config.timeout || 60000,
            maxRedirects: 5,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate'
            },
            // Настройки для перехватчиков ошибок
            validateStatus: function (status) {
                return status >= 200 && status < 300; // Принимаем только 2xx ответы
            }
        };

        // Добавляем прокси агент если он есть
        const finalConfig = { ...defaultConfig, ...customConfig };

        if (this.agent) {
            finalConfig.httpAgent = this.agent;
            finalConfig.httpsAgent = this.agent;
        }

        // Создаем клиент
        this.httpClient = axios.create(finalConfig);

        // Добавляем перехватчик для обработки ошибок
        this.httpClient.interceptors.response.use(
            response => response,
            async error => {
                console.error(`🔄 Ошибка запроса: ${error.message}`);

                if (error.code === 'ECONNREFUSED') {
                    console.error('❌ Не удалось подключиться к прокси или серверу');
                } else if (error.response) {
                    console.error(`📡 HTTP статус: ${error.response.status}`);
                }

                return Promise.reject(error);
            }
        );

        return this.httpClient;
    }

    /**
     * Выполняет GET запрос через прокси
     */
    async get(url, config = {}) {
        const client = this.createHttpClient(config);
        return client.get(url, config);
    }

    /**
     * Выполняет POST запрос через прокси
     */
    async post(url, data, config = {}) {
        const client = this.createHttpClient(config);
        return client.post(url, data, config);
    }

    /**
     * Скачивает файл по URL
     */
    async downloadFile(url, filePath, config = {}) {
        const client = this.createHttpClient({
            responseType: 'stream',
            ...config
        });

        const response = await client.get(url);

        // Проверяем успешность запроса
        if (response.status !== 200) {
            throw new Error(`HTTP ошибка: ${response.status} ${response.statusText}`);
        }

        return response.data;
    }

    /**
     * Получает информацию о текущем прокси
     */
    getProxyInfo() {
        return this.currentProxy ? { ...this.currentProxy } : null;
    }

    /**
     * Включает/выключает использование прокси
     */
    setEnabled(enabled) {
        if (config.proxy) {
            config.proxy.enabled = enabled;
        }

        if (!enabled) {
            this.agent = null;
            this.currentProxy = null;
            this.httpClient = null;
            console.log('🔌 Прокси отключен');
        } else {
            this.initializeAgent();
            console.log('🔌 Прокси включен');
        }
    }

    /**
     * Проверяет работоспособность прокси
     */
    async testProxy(testUrl = 'http://httpbin.org/ip') {
        try {
            console.log(`🧪 Тестирование прокси на ${testUrl}...`);

            const client = this.createHttpClient({
                timeout: 10000,
                responseType: 'json'
            });

            const response = await client.get(testUrl);

            console.log('✅ Прокси работает');
            console.log('📡 Ответ сервера:', response.data);

            return {
                success: true,
                data: response.data,
                proxyUsed: !!this.currentProxy
            };

        } catch (error) {
            console.error('❌ Тест прокси не пройден:', error.message);
            return {
                success: false,
                error: error.message,
                proxyUsed: !!this.currentProxy
            };
        }
    }
}

// Создаем глобальный экземпляр для экспорта
const proxyManagerInstance = new ProxyManager();

// Экспортируем класс и экземпляр
// export { ProxyManager };
export default proxyManagerInstance; // Экспортируем экземпляр по умолчанию