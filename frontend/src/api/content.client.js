// api/content.client.js
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

class ExcludeApiClient {
    constructor() {
        this.movieUrl = `${API_BASE_URL}/movies/exclude`;
        this.seriesUrl = `${API_BASE_URL}/series/exclude`;
    }

    /**
     * Базовый метод для запросов
     */
    async request(url, options = {}) {
        const fetchOptions = {
            method: options.method || 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        };

        console.log('🎬 Exclude API Request:', {
            url,
            method: fetchOptions.method,
            body: options.body
        });

        try {
            const response = await fetch(url, fetchOptions);

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error('❌ Non-JSON response:', text.substring(0, 200));
                throw new Error('Invalid server response');
            }

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('❌ Exclude API request failed:', error);
            throw error;
        }
    }

    /**
     * Исключить фильм
     * @param {number} tmdbId - ID фильма из TMDB
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async excludeMovie(tmdbId) {
        if (!tmdbId || typeof tmdbId !== 'number') {
            throw new Error('Некорректный ID фильма');
        }

        const url = `${this.movieUrl}/${tmdbId}`;

        return this.request(url, {
            method: 'POST',
            body: { media_type: 'movie' } // Тело запроса
        });
    }

    /**
     * Исключить сериал
     * @param {number} tmdbId - ID сериала из TMDB
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async excludeSeries(tmdbId) {
        if (!tmdbId || typeof tmdbId !== 'number') {
            throw new Error('Некорректный ID сериала');
        }

        const url = `${this.seriesUrl}/${tmdbId}`;

        return this.request(url, {
            method: 'POST',
            body: { media_type: 'series' } // Тело запроса
        });
    }

    /**
     * Универсальный метод для исключения любого контента
     * @param {number} tmdbId - ID контента из TMDB
     * @param {'movie'|'series'} mediaType - тип контента
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async excludeContent(tmdbId, mediaType) {
        if (!tmdbId || typeof tmdbId !== 'number') {
            throw new Error('Некорректный ID контента');
        }

        if (!['movie', 'series'].includes(mediaType)) {
            throw new Error('Некорректный тип контента. Допустимо: movie или series');
        }

        const baseUrl = mediaType === 'movie' ? this.movieUrl : this.seriesUrl;
        const url = `${baseUrl}/${tmdbId}`;

        return this.request(url, {
            method: 'POST',
            body: { media_type: mediaType }
        });
    }

    /**
     * Проверить статус исключения
     * @param {number} tmdbId - ID контента из TMDB
     * @param {'movie'|'series'} mediaType - тип контента
     * @returns {Promise<{isExcluded: boolean}>}
     */
    async checkExcluded(tmdbId, mediaType) {
        // Этот метод требует соответствующего эндпоинта на бэкенде
        // Например: GET /api/exclude/check/:id?type=movie
        const url = `${API_BASE_URL}/exclude/check/${tmdbId}?type=${mediaType}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                return { isExcluded: false };
            }

            const data = await response.json();
            return { isExcluded: data.excluded || false };
        } catch (error) {
            console.error('Error checking excluded status:', error);
            return { isExcluded: false };
        }
    }
}

// Создаем и экспортируем единственный экземпляр
export const excludeApi = new ExcludeApiClient();

// Также экспортируем класс на случай, если нужно создать отдельный экземпляр
export default ExcludeApiClient;