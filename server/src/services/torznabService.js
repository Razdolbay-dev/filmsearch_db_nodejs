// services/torznab.service.js
import axios from 'axios';

class TorznabService {
    constructor() {
        this.baseURL = process.env.TORZNAB_URL || 'http://10.1.0.46:8090';
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Поиск торрентов через Torznab API
     * @param {string} query - поисковый запрос
     * @returns {Promise<Array>} - массив результатов
     */
    async searchTorrents(query) {
        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `/torznab/search?query=${encodedQuery}`;

            console.log(`[TorznabService] Searching: ${this.baseURL}${url}`);

            const response = await this.axiosInstance.get(url);

            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Invalid response format from Torznab');
            }

            // Форматируем результаты
            return this.formatResults(response.data);
        } catch (error) {
            console.error('[TorznabService] Search error:', error.message);

            if (error.code === 'ECONNREFUSED') {
                throw new Error('Cannot connect to Torznab server');
            }
            if (error.response) {
                throw new Error(`Torznab server error: ${error.response.status}`);
            }

            throw new Error(`Search failed: ${error.message}`);
        }
    }

    /**
     * Форматирование результатов поиска
     * @param {Array} results - сырые результаты от Torznab
     * @returns {Array} - отформатированные результаты
     */
    formatResults(results) {
        return results.map(item => ({
            ...item,
            // Парсим размер в байты
            sizeBytes: this.parseSizeToBytes(item.Size),
            // Форматированный размер
            formattedSize: this.formatSize(this.parseSizeToBytes(item.Size)),
            // Извлекаем качество
            quality: this.extractQuality(item.Title),
            // Извлекаем аудио дорожки
            audioTracks: this.extractAudioTracks(item.Title),
            // Тип контента
            type: this.extractType(item.Title),
            // Форматированная дата
            formattedDate: this.formatDate(item.CreateDate),
            // Проверка на наличие сидеров
            hasSeeders: (item.Seed || 0) > 0,
            // Рейтинг качества (для сортировки)
            qualityRank: this.getQualityRank(this.extractQuality(item.Title))
        }));
    }

    /**
     * Парсинг размера из строки в байты
     * @param {string} sizeStr - строка с размером (например "13.8 GCiB")
     * @returns {number} - размер в байтах
     */
    parseSizeToBytes(sizeStr) {
        if (!sizeStr) return 0;

        const match = sizeStr.match(/([\d.]+)\s*([GMK]?)Ci?B/);
        if (!match) return 0;

        const size = parseFloat(match[1]);
        const unit = match[2].toUpperCase();

        switch (unit) {
            case 'G': return Math.round(size * 1024 * 1024 * 1024);
            case 'M': return Math.round(size * 1024 * 1024);
            case 'K': return Math.round(size * 1024);
            default: return Math.round(size);
        }
    }

    /**
     * Форматирование размера для отображения
     * @param {number} bytes - размер в байтах
     * @returns {string} - отформатированный размер
     */
    formatSize(bytes) {
        if (bytes >= 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        } else if (bytes >= 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        } else if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${bytes} B`;
    }

    /**
     * Извлечение качества из названия
     * @param {string} title - название торрента
     * @returns {string} - качество
     */
    extractQuality(title) {
        if (!title) return 'Unknown';

        const titleUpper = title.toUpperCase();
        if (titleUpper.includes('2160P') || titleUpper.includes('4K')) return '4K';
        if (titleUpper.includes('1080P')) return '1080p';
        if (titleUpper.includes('720P')) return '720p';
        if (titleUpper.includes('480P')) return '480p';
        return 'Unknown';
    }

    /**
     * Получение рейтинга качества для сортировки
     * @param {string} quality - качество
     * @returns {number} - рейтинг
     */
    getQualityRank(quality) {
        const ranks = {
            '4K': 4,
            '1080p': 3,
            '720p': 2,
            '480p': 1,
            'Unknown': 0
        };
        return ranks[quality] || 0;
    }

    /**
     * Извлечение аудио дорожек из названия
     * @param {string} title - название торрента
     * @returns {string} - список аудио дорожек
     */
    extractAudioTracks(title) {
        if (!title) return 'Unknown';

        const tracks = [];
        if (title.includes('DUB')) tracks.push('Дубляж');
        if (title.includes('2 x MVO')) tracks.push('2x Многоголосый');
        else if (title.includes('MVO')) tracks.push('Многоголосый');
        if (title.includes('Sub')) tracks.push('Субтитры');

        return tracks.length ? tracks.join(', ') : 'Original';
    }

    /**
     * Извлечение типа контента
     * @param {string} title - название торрента
     * @returns {string} - тип
     */
    extractType(title) {
        if (!title) return 'Unknown';

        const hasDub = title.includes('DUB');
        const hasMvo = title.includes('MVO');
        const hasSub = title.includes('Sub');

        if (hasDub && hasMvo) return 'DUB+MVO';
        if (hasDub) return 'DUB';
        if (hasMvo) return 'MVO';
        if (hasSub) return 'Sub';
        return 'Original';
    }

    /**
     * Форматирование даты
     * @param {string} dateStr - строка с датой
     * @returns {string} - отформатированная дата
     */
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';

        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    /**
     * Построение поискового запроса на основе данных фильма
     * @param {Object} movieData - данные фильма
     * @returns {string} - поисковый запрос
     */
    buildSearchQuery(movieData) {
        const { title, original_title, release_date, year } = movieData;

        let query = title || '';

        // Добавляем оригинальное название, если оно отличается
        if (original_title && original_title !== title) {
            query += ` ${original_title}`;
        }

        // Добавляем год
        let movieYear = year;
        if (!movieYear && release_date) {
            movieYear = new Date(release_date).getFullYear();
        }

        if (movieYear && !isNaN(movieYear)) {
            query += ` ${movieYear}`;
        }

        return query.trim();
    }

    /**
     * Валидация URL для скачивания
     * @param {string} url - URL для скачивания
     * @returns {boolean} - валиден ли URL
     */
    validateDownloadUrl(url) {
        if (!url) return false;

        try {
            const parsedUrl = new URL(url);
            return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }
}

// Экспортируем единственный экземпляр сервиса
export default new TorznabService();