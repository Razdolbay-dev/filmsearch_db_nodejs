const API_BASE_URL = import.meta.env.VITE_API_URL ||
    `${window.location.protocol}//${window.location.hostname}/api`;

class CartoonsApiClient {
    constructor() {
        this.baseUrl = `${API_BASE_URL}/cartoons`;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const fetchOptions = {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, fetchOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('❌ Cartoons API request failed:', error);
            throw error;
        }
    }

    // Получить все мультфильмы с пагинацией и фильтром по типу
    async getAllCartoons(page = 1, limit = 20, type = 'all') {
        return this.request(`/?page=${page}&limit=${limit}&type=${type}`);
    }

    // Получить популярные мультфильмы
    async getPopularCartoons(limit = 20) {
        return this.request(`/popular?limit=${limit}`);
    }

    // Поиск мультфильмов
    async searchCartoons(query, page = 1, limit = 20) {
        return this.request(`/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    }

    // Получить мультфильмы по году
    async getCartoonsByYear(year, page = 1, limit = 20) {
        return this.request(`/year/${year}?page=${page}&limit=${limit}`);
    }

    // Получить мультфильм по ID
    async getCartoonById(id) {
        return this.request(`/${id}`);
    }

    // Фильтр по типу (удобный метод)
    async getCartoonsByType(type, page = 1, limit = 20) {
        return this.getAllCartoons(page, limit, type);
    }
}

export const cartoonsApi = new CartoonsApiClient();