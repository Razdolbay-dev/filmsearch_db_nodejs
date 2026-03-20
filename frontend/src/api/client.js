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

    // ========== Torznab Methods ==========

    /**
     * Поиск торрентов через Torznab
     * @param {Object} params - Параметры поиска
     * @param {string} params.query - Прямой поисковый запрос
     * @param {string} params.title - Название фильма/сериала
     * @param {string} params.original_title - Оригинальное название
     * @param {number} params.year - Год выпуска
     * @param {string} params.release_date - Дата релиза
     * @returns {Promise<Object>} - Результаты поиска
     */
    async searchTorrents({ query, title, original_title, year, release_date }) {
        return request('/torznab/search', {
            method: 'POST',
            body: JSON.stringify({
                query,
                title,
                original_title,
                year,
                release_date
            })
        });
    },

    /**
     * Получение информации о торренте
     * @param {string} id - ID торрента
     * @param {string} link - Ссылка на торрент
     * @returns {Promise<Object>} - Информация о торренте
     */
    async getTorrentInfo(id, link) {
        return request(`/torznab/info/${id}${buildQueryString({ link })}`);
    },

    /**
     * Проверка здоровья Torznab сервера
     * @returns {Promise<Object>} - Статус сервера
     */
    async checkTorznabHealth() {
        return request('/torznab/health');
    },

    /**
     * Получение статистики поиска Torznab
     * @returns {Promise<Object>} - Статистика
     */
    async getTorznabStats() {
        return request('/torznab/stats');
    },

    /**
     * Удобный метод для поиска торрентов по фильму
     * @param {Object} movie - Объект фильма
     * @returns {Promise<Object>} - Результаты поиска
     */
    async searchTorrentsForMovie(movie) {
        return this.searchTorrents({
            title: movie.title,
            original_title: movie.original_title,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
            release_date: movie.release_date
        });
    },

    /**
     * Удобный метод для поиска торрентов по сериалу
     * @param {Object} series - Объект сериала
     * @param {number} season - Номер сезона (опционально)
     * @returns {Promise<Object>} - Результаты поиска
     */
    async searchTorrentsForSeries(series, season = null) {
        let query = series.name;
        if (series.original_name && series.original_name !== series.name) {
            query += ` ${series.original_name}`;
        }
        if (series.first_air_date) {
            query += ` ${new Date(series.first_air_date).getFullYear()}`;
        }
        if (season) {
            query += ` S${season.toString().padStart(2, '0')}`;
        }

        return this.searchTorrents({ query });
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

    /**
     * Проверка всех сервисов (основной API и Torznab)
     */
    async checkAllServices() {
        const results = {
            mainApi: false,
            torznab: false,
            timestamp: new Date().toISOString()
        };

        try {
            results.mainApi = await this.checkConnection();
        } catch (error) {
            console.error('Main API check failed:', error);
        }

        try {
            const torznabHealth = await this.checkTorznabHealth();
            results.torznab = torznabHealth.success && torznabHealth.status === 'healthy';
        } catch (error) {
            console.error('Torznab health check failed:', error);
        }

        return results;
    }
};