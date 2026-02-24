const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

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
}

export const adminApi = new AdminApiClient();