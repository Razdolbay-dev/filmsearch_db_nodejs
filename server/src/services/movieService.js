import config from '../config/index.js';
import proxyManager from '../models/ProxyManager.js';

/**
 * Сервис для работы с TMDB API
 */
class TMDBMovieService {
    constructor() {
        this.baseUrl = config.tmdb.movieAPIUrl;
        this.token = config.tmdb.apiToken;
    }

    /**
     * Универсальный метод для выполнения запросов
     */
    async makeRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                ...options.headers
            },
            timeout: options.timeout || config.proxy.timeout || 30000,
            responseType: options.responseType || 'json',
            ...options.axiosConfig
        };

        try {
            // Используем прокси если он включен в конфигурации
            if (config.proxy.enabled) {
                return await this.makeRequestWithProxy(url, defaultOptions);
            } else {
                return await this.makeRequestNative(url, defaultOptions);
            }
        } catch (error) {
            console.error(`❌ Ошибка запроса к ${url}:`, error.message);

            // Добавляем информацию о том, использовался ли прокси
            error.proxyUsed = config.proxy.enabled;

            // Повторная попытка если настроено
            if (options.retry && config.proxy.retryCount > 0) {
                return this.retryRequest(url, defaultOptions, config.proxy.retryCount);
            }

            throw error;
        }
    }

    /**
     * Выполняет запрос через прокси менеджер
     */
    async makeRequestWithProxy(url, options) {
        const proxyOptions = {
            responseType: 'stream',
            timeout: options.timeout,
            headers: {
                'User-Agent': config.tmdb.userAgent,
                'Accept': 'application/json, text/plain, */*',
                ...options.headers
            },
            ...options.axiosConfig
        };

        const response = await proxyManager.get(url, proxyOptions);

        // Если ожидаем JSON, преобразуем stream в объект
        if (options.responseType === 'json') {
            return await this.streamToJson(response.data);
        }

        return response;
    }

    /**
     * Выполняет запрос нативно без прокси
     */
    async makeRequestNative(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        try {
            const response = await fetch(url, {
                method: options.method,
                headers: options.headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (options.responseType === 'json') {
                return await response.json();
            }

            return response;

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Преобразует поток в JSON
     */
    async streamToJson(stream) {
        return new Promise((resolve, reject) => {
            let data = '';
            stream.on('data', chunk => data += chunk);
            stream.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Ошибка парсинга JSON: ${e.message}`));
                }
            });
            stream.on('error', reject);
        });
    }

    /**
     * Повторная попытка выполнения запроса
     */
    async retryRequest(url, options, retriesLeft) {
        console.log(`🔄 Повторная попытка запроса. Осталось попыток: ${retriesLeft}`);

        const delay = Math.pow(2, config.proxy.retryCount - retriesLeft) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            if (config.proxy.enabled) {
                return await this.makeRequestWithProxy(url, options);
            } else {
                return await this.makeRequestNative(url, options);
            }
        } catch (error) {
            if (retriesLeft > 1) {
                return this.retryRequest(url, options, retriesLeft - 1);
            }
            throw error;
        }
    }

    /**
     * Получает детали фильма и актерский состав параллельно
     */
    async getMovieWithCredits(movieId, language = 'ru-RU') {
        const urls = [
            `${this.baseUrl}/${movieId}?language=${language}`,
            `${this.baseUrl}/${movieId}/credits?language=${language}`
        ];

        try {
            console.log(`🎬 Загрузка данных фильма ID: ${movieId}`);
            console.log(`🔧 Прокси ${config.proxy.enabled ? 'включен' : 'выключен'}`);

            const [movieDetails, credits] = await Promise.all(
                urls.map(url => this.makeRequest(url, {
                    retry: true,
                    timeout: 15000
                }))
            );

            return {
                success: true,
                data: {
                    ...movieDetails,
                    credits: credits
                },
                metadata: {
                    movieId,
                    language,
                    proxyUsed: config.proxy.enabled,
                    castCount: credits.cast?.length || 0,
                    crewCount: credits.crew?.length || 0,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                movieId,
                proxyUsed: config.proxy.enabled,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Получает только детали фильма
     */
    async getMovieDetails(movieId, language = 'ru-RU') {
        const url = `${this.baseUrl}/${movieId}?language=${language}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    movieId,
                    language,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                movieId,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получает только актерский состав
     */
    async getMovieCredits(movieId, language = 'ru-RU') {
        const url = `${this.baseUrl}/${movieId}/credits?language=${language}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    movieId,
                    language,
                    proxyUsed: config.proxy.enabled,
                    castCount: data.cast?.length || 0,
                    crewCount: data.crew?.length || 0,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                movieId,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получает несколько фильмов одновременно
     */
    async getMultipleMovies(movieIds, language = 'ru-RU') {
        const requests = movieIds.map(id =>
            this.getMovieDetails(id, language)
        );

        const results = await Promise.all(requests);

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        return {
            success: true,
            data: {
                movies: successful.map(r => r.data),
                failed: failed.map(r => ({ id: r.movieId, error: r.error }))
            },
            metadata: {
                total: results.length,
                successCount: successful.length,
                failCount: failed.length,
                language,
                proxyUsed: config.proxy.enabled,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Ищет фильмы по названию
     */
    async searchMovies(query, language = 'ru-RU', page = 1) {
        const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=${language}&page=${page}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    query,
                    language,
                    page,
                    totalResults: data.total_results,
                    totalPages: data.total_pages,
                    resultsCount: data.results?.length || 0,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                query,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Проверяет соединение с TMDB API
     */
    async testConnection() {
        const testUrl = `${this.baseUrl}/550?language=ru-RU`; // Fight Club

        try {
            const startTime = Date.now();
            const data = await this.makeRequest(testUrl, {
                timeout: 10000
            });
            const endTime = Date.now();

            return {
                success: true,
                data: {
                    apiStatus: 'online',
                    responseTime: endTime - startTime,
                    testMovie: data.title
                },
                metadata: {
                    proxyUsed: config.proxy.enabled,
                    responseTimeMs: endTime - startTime,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: {
                    apiStatus: 'offline'
                },
                metadata: {
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
}

// Экспортируем синглтон
const tmdbMovieService = new TMDBMovieService();
export default tmdbMovieService;