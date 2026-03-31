// Класс для обработки ошибок API
class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// Функция для получения базового URL API
function getApiBaseUrl() {
    // Получаем текущий хост и порт из браузера
    const { protocol, hostname, port } = window.location;

    // Формируем URL API на том же хосте
    return `${protocol}//${hostname}:5000/api`;
}

// Базовые методы для запросов
async function request(endpoint, options = {}) {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    // Добавляем таймаут
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        console.log(`🌐 API Request: ${url}`); // Для отладки

        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        clearTimeout(timeoutId);

        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = { message: 'Invalid JSON response' };
        }

        if (!response.ok) {
            throw new ApiError(
                data.error || data.message || 'API request failed',
                response.status,
                data
            );
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new ApiError('Request timeout', 408, { message: 'Request timeout' });
        }

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(error.message, 500, { message: error.message });
    }
}

// Утилиты для построения query string
function buildQueryString(params) {
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    }

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
}

export const apiClient = {
    // Movies
    async getMovies(page = 1, limit = 20) {
        return request(`/movies${buildQueryString({ page, limit })}`);
    },

    async getMovieById(id) {
        return request(`/movies/${id}`);
    },

    async searchMovies(query, page = 1, limit = 20) {
        return request(`/movies/search${buildQueryString({ q: query, page, limit })}`);
    },

    async getPopularMovies(limit = 20) {
        return request(`/movies/popular${buildQueryString({ limit })}`);
    },

    async getMoviesByGenre(genreId, page = 1, limit = 20) {
        return request(`/movies/genre/${genreId}${buildQueryString({ page, limit })}`);
    },

    async getMoviesByYear(year, page = 1, limit = 20) {
        return request(`/movies/year/${year}${buildQueryString({ page, limit })}`);
    },

    // Series
    async getSeries(page = 1, limit = 100) {
        return request(`/series${buildQueryString({ page, limit })}`);
    },

    async getSeriesById(id) {
        return request(`/series/${id}`);
    },

    async searchSeries(query, page = 1, limit = 20) {
        return request(`/series/search${buildQueryString({ q: query, page, limit })}`);
    },

    async getPopularSeries(limit = 20) {
        return request(`/series/popular${buildQueryString({ limit })}`);
    },

    async getInProductionSeries(page = 1, limit = 20) {
        return request(`/series/in-production${buildQueryString({ page, limit })}`);
    },

    async getSeriesByGenre(genreId, page = 1, limit = 20) {
        return request(`/series/genre/${genreId}${buildQueryString({ page, limit })}`);
    },

    async getSeriesSeasons(seriesId) {
        return request(`/series/${seriesId}/seasons`);
    },

    async getSeasonEpisodes(seasonId) {
        return request(`/series/seasons/${seasonId}/episodes`);
    },

    // ========== Utility Methods ==========

    /**
     * Получить текущий URL API (для отладки)
     */
    getCurrentApiUrl() {
        return getApiBaseUrl();
    },

    /**
     * Проверка соединения с API
     */
    async checkConnection() {
        try {
            const baseUrl = getApiBaseUrl().replace('/api', '');
            const response = await fetch(baseUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        } catch {
            return false;
        }
    },

    // Добавим в конец файла client.js, после существующих методов

    // ========== TorrServer Integration Methods ==========

    /**
     * Поиск торрентов с приоритетом RuTor
     * @param {string} query - поисковый запрос
     * @param {Object} options - опции поиска
     * @returns {Promise<Object>} - результаты поиска
     */
    async searchTorrents(query, options = {}) {
        const { limit = 50, minSeeders = 0, priority = 'rutor', fallback = true } = options;
        return request(`/torrserver/search${buildQueryString({
            q: query,
            limit,
            minSeeders,
            priority,
            fallback
        })}`);
    },

    // Получить структурированный торрент по хешу
    async getTorrentByHash(hash) {
        return request(`/torrserver/torrents/${hash}`);
    },

    /**
     * Поиск только в RuTor
     * @param {string} query - поисковый запрос
     * @returns {Promise<Object>} - результаты поиска
     */
    async searchRuTor(query) {
        if (!query) {
            throw new Error('Query parameter is required');
        }

        return request(`/torrserver/search/rutor${buildQueryString({ q: query })}`);
    },

    /**
     * Поиск только в Torznab
     * @param {string} query - поисковый запрос
     * @returns {Promise<Object>} - результаты поиска
     */
    async searchTorznab(query) {
        if (!query) {
            throw new Error('Query parameter is required');
        }

        return request(`/torrserver/search/torznab${buildQueryString({ q: query })}`);
    },

    /**
     * Добавить торрент в TorrServer
     * @param {string} link - magnet или torznab ссылка
     * @param {Object} options - опции добавления
     * @returns {Promise<Object>} - результат добавления
     */
    async addTorrentToTorrServer(link, options = {}) {
        const { title, category, saveToDb = true } = options;
        return request('/torrserver/torrents/add', {
            method: 'POST',
            body: JSON.stringify({
                link,
                title,
                category,
                saveToDb
            })
        });
    },

    /**
     * Получить список торрентов в TorrServer
     */
    async getTorrServerTorrents() {
        return request('/torrserver/torrents');
    },

    /**
     * Удалить торрент из TorrServer
     * @param {string} hash - хеш торрента
     */
    async removeTorrentFromTorrServer(hash) {
        return request(`/torrserver/torrents/${hash}`, {
            method: 'DELETE'
        });
    },

    // Добавляем новые методы для трендовых данных
    async getTrendingMovies(limit = 20, language = 'ru-RU') {
        return request(`/movies/trending${buildQueryString({ limit, language })}`);
    },

    async getTrendingSeries(limit = 20, language = 'ru-RU') {
        return request(`/series/trending${buildQueryString({ limit, language })}`);
    },

    // Если нужен доступ к сырым данным из TMDB (облегченная версия)
    async getTrendingMoviesFromTMDB(limit = 20, language = 'ru-RU') {
        return request(`/movies/trending/tmdb${buildQueryString({ limit, language })}`);
    },

    async getTrendingSeriesFromTMDB(limit = 20, language = 'ru-RU') {
        return request(`/series/trending/tmdb${buildQueryString({ limit, language })}`);
    },

};