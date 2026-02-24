const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

class SyncApiClient {
    constructor() {
        this.baseUrl = `${API_BASE_URL}/sync`;
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

        const response = await fetch(url, fetchOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Sync API request failed');
        }

        return data;
    }

    // Получить все задачи
    async getJobs() {
        return this.request('/jobs');
    }

    // Запустить синхронизацию фильмов
    async startMovies(params = { popularity: 1 }) {
        return this.request('/movies', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }

    // Запустить синхронизацию сериалов
    async startSeries(params = { popularity: 1 }) {
        return this.request('/series', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }

    // Управление задачей
    async controlJob(jobId, action) {
        return this.request(`/job/${jobId}/${action}`, {
            method: 'POST'
        });
    }

    // Удалить задачу
    async deleteJob(jobId) {
        return this.request(`/job/${jobId}`, {
            method: 'DELETE'
        });
    }

    // Очистить завершенные задачи
    async clearCompleted() {
        // Получаем все задачи и удаляем завершенные
        const { jobs } = await this.getJobs();
        const completedJobs = jobs.filter(job =>
            ['completed', 'failed', 'stopped'].includes(job.status)
        );

        for (const job of completedJobs) {
            await this.deleteJob(job.id);
        }

        return { success: true, count: completedJobs.length };
    }
}

export const syncApi = new SyncApiClient();