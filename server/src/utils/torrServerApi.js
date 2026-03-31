import axios from 'axios';

export class TorrServerAPI {
    constructor(baseURL = 'http://10.1.0.46:8090') {
        this.client = axios.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Получить список всех торрентов
     */
    async getAllTorrents() {
        try {
            const response = await this.client.post('/torrents', {
                action: 'list'
            });

            // Убедимся, что возвращаем массив
            if (Array.isArray(response.data)) {
                return response.data;
            }

            // Если API вернул объект с торрентами в каком-то поле
            if (response.data && response.data.torrents) {
                return response.data.torrents;
            }

            return [];
        } catch (error) {
            console.error('Error fetching torrents:', error.message);
            throw error;
        }
    }

    /**
     * Получить информацию о конкретном торренте по хешу
     */
    async getTorrentByHash(hash) {
        try {
            const response = await this.client.post('/torrents', {
                action: 'get',
                hash: hash
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching torrent ${hash}:`, error.message);
            throw error;
        }
    }

    /**
     * Добавить торрент по magnet-ссылке или Torznab-ссылке
     * @param {string} link - magnet ссылка или Torznab ссылка
     * @param {Object} options - опции добавления
     * @returns {Promise<Object>} - результат добавления
     */
    async addTorrentByMagnet(link, options = {}) {
        try {
            if (!link) {
                throw new Error('Link is required');
            }

            const payload = {
                action: 'add',
                link: link, // TorrServer сам понимает magnet и Torznab ссылки
                save_to_db: options.saveToDb !== undefined ? options.saveToDb : true,
            };

            if (options.title) payload.title = options.title;
            if (options.category) payload.category = options.category;
            if (options.poster) payload.poster = options.poster;
            if (options.data) payload.data = options.data;

            console.log('Adding torrent with link type:', link.startsWith('magnet:') ? 'magnet' : 'torznab');

            const response = await this.client.post('/torrents', payload);
            return response.data;
        } catch (error) {
            console.error('Error adding torrent:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Добавить торрент по .torrent файлу (base64)
     */
    async addTorrentByFile(torrentFileBase64, options = {}) {
        try {
            const payload = {
                action: 'add',
                data: torrentFileBase64,
                save_to_db: options.saveToDb !== undefined ? options.saveToDb : true,
            };

            if (options.title) payload.title = options.title;
            if (options.category) payload.category = options.category;
            if (options.poster) payload.poster = options.poster;

            const response = await this.client.post('/torrents', payload);
            return response.data;
        } catch (error) {
            console.error('Error adding torrent file:', error.message);
            throw error;
        }
    }

    /**
     * Удалить торрент
     */
    async removeTorrent(hash) {
        try {
            const response = await this.client.post('/torrents', {
                action: 'rem',
                hash: hash
            });
            return response.data;
        } catch (error) {
            console.error(`Error removing torrent ${hash}:`, error.message);
            throw error;
        }
    }

    /**
     * Остановить торрент (удалить из памяти, но оставить в БД)
     */
    async dropTorrent(hash) {
        try {
            const response = await this.client.post('/torrents', {
                action: 'drop',
                hash: hash
            });
            return response.data;
        } catch (error) {
            console.error(`Error dropping torrent ${hash}:`, error.message);
            throw error;
        }
    }

    /**
     * Полностью удалить торрент из БД
     */
    async wipeTorrent(hash) {
        try {
            const response = await this.client.post('/torrents', {
                action: 'wipe',
                hash: hash
            });
            return response.data;
        } catch (error) {
            console.error(`Error wiping torrent ${hash}:`, error.message);
            throw error;
        }
    }

    /**
     * Обновить информацию о торренте (например, категорию или постер)
     */
    async setTorrentInfo(hash, updates) {
        try {
            const payload = {
                action: 'set',
                hash: hash,
            };

            if (updates.title) payload.title = updates.title;
            if (updates.category) payload.category = updates.category;
            if (updates.poster) payload.poster = updates.poster;
            if (updates.data) payload.data = updates.data;

            const response = await this.client.post('/torrents', payload);
            return response.data;
        } catch (error) {
            console.error(`Error updating torrent ${hash}:`, error.message);
            throw error;
        }
    }

    /**
     * Получить статистику по торренту
     * Примечание: статистика может быть в ответе на get запрос или отдельным эндпоинтом
     */
    async getTorrentStats(hash) {
        try {
            // Статистика обычно возвращается вместе с get запросом
            const torrent = await this.getTorrentByHash(hash);
            return {
                hash: torrent.hash,
                stat: torrent.stat,
                stat_string: torrent.stat_string,
                total_peers: torrent.total_peers,
                pending_peers: torrent.pending_peers,
                active_peers: torrent.active_peers,
                connected_seeders: torrent.connected_seeders,
                bytes_written: torrent.bytes_written,
                bytes_read: torrent.bytes_read,
                torrent_size: torrent.torrent_size,
            };
        } catch (error) {
            console.error(`Error fetching stats for ${hash}:`, error.message);
            throw error;
        }
    }

    /**
     * Получить информацию о всех активных торрентах (только загруженные в память)
     */
    async getActiveTorrents() {
        try {
            const allTorrents = await this.getAllTorrents();
            // Фильтруем только активные (stat: 3 - working, 4 - paused, 2 - downloading)
            return allTorrents.filter(t => t.stat === 3 || t.stat === 2 || t.stat === 4);
        } catch (error) {
            console.error('Error fetching active torrents:', error.message);
            throw error;
        }
    }

    /**
     * Принудительно запустить торрент (если он остановлен)
     */
    async startTorrent(hash) {
        try {
            // Для старта используем set с определенными параметрами
            const response = await this.client.post('/torrents', {
                action: 'set',
                hash: hash,
                data: 'start' // или другой параметр, который поддерживает TorrServer
            });
            return response.data;
        } catch (error) {
            console.error(`Error starting torrent ${hash}:`, error.message);
            throw error;
        }
    }

    /**
     * Приостановить торрент
     */
    async pauseTorrent(hash) {
        try {
            const response = await this.client.post('/torrents', {
                action: 'set',
                hash: hash,
                data: 'pause'
            });
            return response.data;
        } catch (error) {
            console.error(`Error pausing torrent ${hash}:`, error.message);
            throw error;
        }
    }

    /**
     * Проверить доступность TorrServer
     */
    async healthCheck() {
        try {
            // Пробуем получить список торрентов как проверку связи
            await this.getAllTorrents();
            return { status: 'ok', connected: true };
        } catch (error) {
            return { status: 'error', connected: false, message: error.message };
        }
    }

    /**
     * Поиск через RuTor (приоритетный)
     * @param {string} query - поисковый запрос
     * @returns {Promise<Array>} - массив результатов
     */
    async searchRuTor(query) {
        try {
            const response = await this.client.get('/search', {
                params: { query },
                timeout: 15000, // Увеличиваем таймаут для поиска
            });

            // Нормализуем ответ
            if (Array.isArray(response.data)) {
                return response.data.map(item => this.normalizeRuTorResult(item));
            }

            return [];
        } catch (error) {
            console.error('Error searching RuTor:', error.message);
            return []; // Возвращаем пустой массив при ошибке
        }
    }

    /**
     * Поиск через Torznab/Jackett
     * @param {string} query - поисковый запрос
     * @returns {Promise<Array>} - массив результатов
     */
    async searchTorznab(query) {
        try {
            const response = await this.client.get('/torznab/search', {
                params: { query },
                timeout: 15000,
            });

            // Нормализуем ответ
            if (Array.isArray(response.data)) {
                return response.data.map(item => this.normalizeTorznabResult(item));
            }

            return [];
        } catch (error) {
            console.error('Error searching Torznab:', error.message);
            return [];
        }
    }

    /**
     * Универсальный поиск с приоритетом RuTor
     * @param {string} query - поисковый запрос
     * @param {Object} options - опции поиска
     * @returns {Promise<Object>} - результаты поиска
     */
    async search(query, options = {}) {
        const {
            priority = 'rutor', // 'rutor' или 'torznab'
            fallback = true,    // использовать fallback если нет результатов
            limit = 50,         // лимит результатов
            minSeeders = 0,     // минимальное количество сидеров
        } = options;

        let results = [];
        let source = '';

        if (priority === 'rutor') {
            // Сначала ищем в RuTor
            results = await this.searchRuTor(query);
            source = 'rutor';

            // Если нет результатов и включен fallback, ищем в Torznab
            if (results.length === 0 && fallback) {
                results = await this.searchTorznab(query);
                source = results.length > 0 ? 'torznab' : source;
            }
        } else {
            // Сначала ищем в Torznab
            results = await this.searchTorznab(query);
            source = 'torznab';

            // Если нет результатов и включен fallback, ищем в RuTor
            if (results.length === 0 && fallback) {
                results = await this.searchRuTor(query);
                source = results.length > 0 ? 'rutor' : source;
            }
        }

        // Фильтруем по минимальному количеству сидеров
        if (minSeeders > 0) {
            results = results.filter(item => (item.seeders || 0) >= minSeeders);
        }

        // Ограничиваем количество результатов
        if (limit > 0 && results.length > limit) {
            // Сортируем по количеству сидеров (сначала больше)
            results.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));
            results = results.slice(0, limit);
        }

        return {
            query,
            source,
            total: results.length,
            results,
        };
    }

    /**
     * Нормализация результата RuTor
     */
    normalizeRuTorResult(item) {
        return {
            title: item.Title,
            name: item.Name,
            alternativeNames: item.Names || [],
            categories: item.Categories || 'Movie',
            size: item.Size,
            sizeBytes: this.parseSizeToBytes(item.Size),
            created: item.CreateDate,
            tracker: item.Tracker || 'Rutor',
            link: item.Link,
            year: item.Year,
            peers: item.Peer || 0,
            seeders: item.Seed || 0,
            magnet: item.Magnet,
            hash: item.Hash,
            imdbId: item.IMDBID,
            videoQuality: item.VideoQuality,
            audioQuality: item.AudioQuality,
            source: 'rutor',
            // Формируем magnet-ссылку если есть
            magnetLink: item.Magnet || null,
        };
    }

    /**
     * Нормализация результата Torznab
     */
    normalizeTorznabResult(item) {
        return {
            title: item.Title || item.Name,
            name: item.Name,
            alternativeNames: item.Names || [],
            categories: item.Categories || '',
            size: item.Size,
            sizeBytes: this.parseSizeToBytes(item.Size),
            created: item.CreateDate,
            tracker: item.Tracker || 'Jackett',
            link: item.Link, // Сохраняем оригинальную ссылку для добавления
            year: item.Year,
            peers: item.Peer || 0,
            seeders: item.Seed || 0,
            magnet: item.Magnet || null,
            hash: item.Hash,
            imdbId: item.IMDBID,
            videoQuality: item.VideoQuality,
            audioQuality: item.AudioQuality,
            source: 'torznab',
            // Для Torznab ссылка уже готова к использованию в addTorrentByMagnet
            torrentLink: item.Link,
        };
    }

    /**
     * Парсинг размера в байты
     */
    parseSizeToBytes(sizeStr) {
        if (!sizeStr) return 0;

        const units = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024,
            'CiB': 1024 * 1024 * 1024, // GCiB = GiB
            'GCiB': 1024 * 1024 * 1024,
        };

        const match = sizeStr.match(/([\d.]+)\s*([A-Za-z]+)/);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2];
            const multiplier = units[unit] || units['GB'];
            return Math.round(value * multiplier);
        }

        return 0;
    }

    /**
     * Извлечение magnet-ссылки из Link (для Torznab)
     */
    extractMagnetFromLink(link) {
        if (!link) return null;

        // Если ссылка уже magnet
        if (link.startsWith('magnet:')) {
            return link;
        }

        // Если ссылка содержит параметры для Jackett, пытаемся извлечь magnet
        // В реальном ответе Torznab magnet может быть в отдельном поле
        // или в Link может быть magnet после редиректа
        return null;
    }

    /**
     * Получить детальную информацию о результате поиска
     * (можно использовать для получения magnet-ссылки, если её нет)
     */
    async getTorrentDetails(link) {
        try {
            // Если ссылка ведет на страницу торрента
            if (link && !link.startsWith('magnet:')) {
                // Пробуем получить magnet через HEAD запрос или по ссылке
                const response = await this.client.head(link, {
                    maxRedirects: 5,
                    timeout: 10000,
                });

                // Если есть заголовок Location с magnet
                if (response.headers.location && response.headers.location.startsWith('magnet:')) {
                    return { magnet: response.headers.location };
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting torrent details:', error.message);
            return null;
        }
    }
}