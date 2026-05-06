const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}/api`;

class AdminApiClient {
    constructor() {
        this.baseUrl = `${API_BASE_URL}/admin`;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const fetchOptions = {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
        };

        console.log('🌐 API Request:', {
            url,
            method: options.method || 'GET',
            credentials: 'include'
        });

        try {
            const response = await fetch(url, fetchOptions);

            // Проверяем cookies
            console.log('🍪 Response headers:', {
                'set-cookie': response.headers.get('set-cookie'),
                'content-type': response.headers.get('content-type')
            });

            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                console.log('📦 Response data:', data);
            } else {
                const text = await response.text();
                console.error('❌ Non-JSON response:', text.substring(0, 200));
                throw new Error('Invalid server response');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('❌ API request failed:', error);
            throw error;
        }
    }

    // Аутентификация
    async login(username, password) {
        return this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async logout() {
        return this.request('/logout', {
            method: 'POST'
        });
    }

    async getCurrentAdmin() {
        return this.request('/me');
    }

    // Управление администраторами
    async getAllAdmins() {
        return this.request('/admins');
    }

    async createAdmin(adminData) {
        return this.request('/admins', {
            method: 'POST',
            body: JSON.stringify(adminData)
        });
    }

    async deleteAdmin(id) {
        return this.request(`/admins/${id}`, {
            method: 'DELETE'
        });
    }

    async changePassword(oldPassword, newPassword) {
        return this.request('/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        });
    }

    /**
     * Исключить контент из синхронизации (добавить в blacklist)
     * @param {number} tmdbId - ID контента из TMDB
     * @param {'movie'|'series'} mediaType - тип контента
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async excludeContent(tmdbId, mediaType) {
        // Используем маршрут /api/movies/exclude/:id (он универсальный)
        // Так как у нас baseUrl = /api/admin, а нужен /api/movies/exclude/:id
        // Сделаем запрос напрямую к API без /admin префикса

        const url = `${API_BASE_URL}/movies/exclude/${tmdbId}`;

        console.log('🎬 Excluding content:', { tmdbId, mediaType, url });

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ media_type: mediaType })
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('❌ Non-JSON response:', text.substring(0, 200));
            throw new Error('Invalid server response from exclude endpoint');
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to exclude content');
        }

        return data;
    }

    // Альтернативный вариант: если хочешь использовать универсальный метод через request
    // async excludeContentViaRequest(tmdbId, mediaType) {
        // Этот метод будет использовать /api/admin/exclude-content
        // Но тебе нужно будет добавить соответствующий маршрут на бэкенде
    //     return this.request('/exclude-content', {
    //         method: 'POST',
    //         body: JSON.stringify({
    //             tmdb_id: tmdbId,
    //             media_type: mediaType
    //         })
    //     });
    // }
}

export const adminApi = new AdminApiClient();