import config from '../config/index.js';
import proxyManager from '../models/ProxyManager.js';

class TrendingTMDBService{
    constructor() {
        this.baseUrl = config.tmdb.trendingAPIUrl;
        this.token = config.tmdb.apiToken;
        this.requestDelay = 250;
        this.maxConcurrentRequests = 5;
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
            if (config.proxy.enabled) {
                return await this.makeRequestWithProxy(url, defaultOptions);
            } else {
                return await this.makeRequestNative(url, defaultOptions);
            }
        } catch (error) {
            console.error(`❌ Ошибка запроса к ${url}:`, error.message);
            error.proxyUsed = config.proxy.enabled;

            if (options.retry && config.proxy.retryCount > 0) {
                return this.retryRequest(url, defaultOptions, config.proxy.retryCount);
            }

            throw error;
        }
    }

    /**
     * Выполняет запрос через прокси
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
     * Получает трендовые фильмы с полной информацией
     */
    async getMovieTrending(language = 'ru-RU') {
        const url = `${this.baseUrl}/movie/day?language=${language}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    language,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получает только ID трендовых фильмов (облегченная версия)
     */
    async getTrendingMovieIds(language = 'ru-RU') {
        const url = `${this.baseUrl}/movie/day?language=${language}`;
        console.log(`URL: ${url}`)

        try {
            const data = await this.makeRequest(url, { retry: true });

            // Извлекаем только ID и базовую информацию
            const simplifiedData = {
                page: data.page,
                total_pages: data.total_pages,
                total_results: data.total_results,
                results: data.results.map(movie => ({
                    id: movie.id,
                    title: movie.title,
                    original_title: movie.original_title,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                    vote_count: movie.vote_count,
                    popularity: movie.popularity,
                    overview: movie.overview,
                    genre_ids: movie.genre_ids,
                    adult: movie.adult,
                    media_type: movie.media_type
                }))
            };

            return {
                success: true,
                data: simplifiedData,
                metadata: {
                    language,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получает трендовые сериалы с полной информацией
     */
    async getTvSeriesTrending(language = 'ru-RU') {
        const url = `${this.baseUrl}/tv/day?language=${language}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    language,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получает только ID трендовых сериалов (облегченная версия)
     */
    async getTrendingSeriesIds(language = 'ru-RU') {
        const url = `${this.baseUrl}/tv/day?language=${language}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            // Извлекаем только ID и базовую информацию
            const simplifiedData = {
                page: data.page,
                total_pages: data.total_pages,
                total_results: data.total_results,
                results: data.results.map(series => ({
                    id: series.id,
                    name: series.name,
                    original_name: series.original_name,
                    poster_path: series.poster_path,
                    backdrop_path: series.backdrop_path,
                    first_air_date: series.first_air_date,
                    vote_average: series.vote_average,
                    vote_count: series.vote_count,
                    popularity: series.popularity,
                    overview: series.overview,
                    genre_ids: series.genre_ids,
                    origin_country: series.origin_country,
                    media_type: series.media_type
                }))
            };

            return {
                success: true,
                data: simplifiedData,
                metadata: {
                    language,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получает трендовые фильмы с ограниченным количеством полей
     */
    async getTrendingMoviesLight(limit = 20, language = 'ru-RU') {
        const result = await this.getTrendingMovieIds(language);

        if (!result.success) {
            return result;
        }

        // Ограничиваем количество результатов
        if (limit && result.data.results.length > limit) {
            result.data.results = result.data.results.slice(0, limit);
            result.data.total_results = limit;
        }

        return result;
    }

    /**
     * Получает трендовые сериалы с ограниченным количеством полей
     */
    async getTrendingSeriesLight(limit = 20, language = 'ru-RU') {
        const result = await this.getTrendingSeriesIds(language);

        if (!result.success) {
            return result;
        }

        // Ограничиваем количество результатов
        if (limit && result.data.results.length > limit) {
            result.data.results = result.data.results.slice(0, limit);
            result.data.total_results = limit;
        }

        return result;
    }
}

// Экспортируем синглтон
const trendingTMDBService = new TrendingTMDBService();
export default trendingTMDBService;