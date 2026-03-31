import axios from 'axios';

class TorznabService {
    constructor() {
        this.trackers = {
            kinozal: {
                name: 'Kinozal',
                baseURL: 'http://10.1.0.46:8090',
                endpoint: '/torznab/search',
                enabled: true,
                priority: 1,
                timeout: 30000
            },
            rutor: {
                name: 'Rutor',
                baseURL: 'http://10.1.0.46:8090',
                endpoint: '/search',
                enabled: true,
                priority: 2,
                timeout: 30000
            }
        };

        // Конфигурация TorrServer API
        this.torrServerConfig = {
            baseURL: 'http://10.1.0.46:8090',
            // Правильные эндпоинты TorrServer
            torrentsEndpoint: '/torrents',  // Для управления торрентами
            streamEndpoint: '/stream',      // Для стриминга
            playlistEndpoint: '/playlist',      // Для стриминга
            apiKey: process.env.JACKETT_API_KEY || 'mcedm3bwiymu7snboxnrwyrmzbc6fjd0'
        };

        this.clients = {};
        Object.keys(this.trackers).forEach(key => {
            this.clients[key] = axios.create({
                baseURL: this.trackers[key].baseURL,
                timeout: this.trackers[key].timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        });

        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000;
        this.activeTorrents = new Map();
    }

    /**
     * Получение информации о торренте по хешу
     */
    async getTorrentInfo(hash) {
        try {
            const url = `${this.torrServerConfig.baseURL}${this.torrServerConfig.torrentsEndpoint}`;

            const response = await axios.post(url, {
                action: 'get',
                hash: hash
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Парсим data если это строка JSON
            if (response.data && response.data.data && typeof response.data.data === 'string') {
                try {
                    const parsedData = JSON.parse(response.data.data);
                    response.data.parsedData = parsedData;
                } catch (e) {
                    console.error('[TorznabService] Error parsing data field:', e);
                }
            }

            return response.data;

        } catch (error) {
            console.error('[TorznabService] Error getting torrent info:', error.message);
            throw error;
        }
    }

    /**
     * Получение M3U плейлиста для торрента
     * @param {string} hash - хеш торрента
     * @returns {Promise<string>} - M3U плейлист
     */
    async getM3UPlaylist(hash) {
        try {
            const url = `${this.torrServerConfig.baseURL}/playlist?hash=${hash}`;

            console.log(`[TorznabService] Getting M3U playlist: ${url}`);

            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'Accept': 'audio/x-mpegurl'
                },
                responseType: 'text'
            });

            return response.data;

        } catch (error) {
            console.error('[TorznabService] Error getting M3U playlist:', error);
            throw new Error(`Failed to get M3U playlist: ${error.message}`);
        }
    }

    /**
     * Получение M3U плейлиста с возможностью выбора файлов
     * @param {string} hash - хеш торрента
     * @param {Array} fileIds - ID файлов для включения в плейлист (опционально)
     * @returns {Promise<string>} - M3U плейлист
     */
    async getCustomM3UPlaylist(hash, fileIds = null) {
        try {
            // Если указаны конкретные файлы, получаем информацию о торренте
            if (fileIds && fileIds.length > 0) {
                const torrentInfo = await this.getTorrentInfo(hash);
                const videoFiles = this.findVideoFiles(torrentInfo);

                // Фильтруем только выбранные файлы
                const selectedFiles = videoFiles.filter(f => fileIds.includes(f.id));

                if (selectedFiles.length === 0) {
                    throw new Error('No selected files found');
                }

                // Создаем M3U плейлист вручную
                let m3u = '#EXTM3U\n';
                m3u += `# Playlist for torrent: ${hash}\n`;
                m3u += `# Created: ${new Date().toISOString()}\n\n`;

                selectedFiles.forEach(file => {
                    const streamUrl = this.getTorrentStreamUrl(hash, file.id, file.path);
                    const duration = file.duration || 0;
                    const title = file.name.replace(/\.(mkv|mp4|avi|mov)$/i, '');

                    m3u += `#EXTINF:${duration},${title}\n`;
                    m3u += `${streamUrl}\n\n`;
                });

                return m3u;
            }

            // Иначе получаем стандартный плейлист от TorrServer
            return await this.getM3UPlaylist(hash);

        } catch (error) {
            console.error('[TorznabService] Error creating custom M3U playlist:', error);
            throw error;
        }
    }

    /**
     * Получение списка всех активных торрентов из TorrServer
     */
    async getTorrentsList() {
        try {
            const url = `${this.torrServerConfig.baseURL}${this.torrServerConfig.torrentsEndpoint}`;

            const response = await axios.post(url, {
                action: 'list'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Парсим каждый торрент
            const torrents = [];
            if (response.data && response.data.torrents) {
                for (const torrent of response.data.torrents) {
                    // Получаем детальную информацию для каждого торрента
                    const info = await this.getTorrentInfo(torrent.hash);
                    const videoFiles = this.findVideoFiles(info);

                    torrents.push({
                        hash: torrent.hash,
                        title: torrent.title || info.title,
                        name: torrent.name || info.name,
                        stat: torrent.stat || info.stat,
                        stat_string: torrent.stat_string || info.stat_string,
                        addedAt: torrent.added_at ? new Date(torrent.added_at * 1000).toISOString() : null,
                        size: torrent.torrent_size || info.torrent_size,
                        formattedSize: this.formatSize(torrent.torrent_size || info.torrent_size),
                        videoFiles: videoFiles,
                        hasVideo: videoFiles.length > 0,
                        firstVideoFile: videoFiles.length > 0 ? videoFiles[0] : null
                    });
                }
            }

            return {
                success: true,
                torrents: torrents,
                count: torrents.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('[TorznabService] Error getting torrents list:', error);
            throw new Error(`Failed to get torrents list: ${error.message}`);
        }
    }

    /**
     * Удаление торрента из TorrServer
     * @param {string} hash - хеш торрента
     */
    async removeTorrent(hash) {
        try {
            const url = `${this.torrServerConfig.baseURL}${this.torrServerConfig.torrentsEndpoint}`;

            const response = await axios.post(url, {
                action: 'remove',
                hash: hash
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Также удаляем из локального кэша
            this.activeTorrents.delete(hash);

            return {
                success: true,
                hash: hash,
                message: 'Torrent removed successfully',
                response: response.data
            };

        } catch (error) {
            console.error('[TorznabService] Error removing torrent:', error);
            throw new Error(`Failed to remove torrent: ${error.message}`);
        }
    }

    /**
     * Добавление торрента и получение стрим-ссылки (исправленная версия)
     */
    async addTorrentAndGetStream(torrentUrl, options = {}) {
        try {
            console.log(`[TorznabService] Adding torrent: ${torrentUrl}`);

            // 1. Добавляем торрент в TorrServer
            const addResult = await this.addTorrentToTorrServer(torrentUrl, options);

            if (!addResult || !addResult.hash) {
                throw new Error('Failed to get torrent hash from TorrServer');
            }

            const torrentHash = addResult.hash;
            console.log(`[TorznabService] Torrent added with hash: ${torrentHash}`);

            // 2. Ждем, пока TorrServer обработает торрент
            // Пробуем несколько раз с увеличением задержки
            let torrentInfo = null;
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));

                torrentInfo = await this.getTorrentInfo(torrentHash);
                console.log(`[TorznabService] Torrent info (attempt ${attempts + 1}):`, {
                    stat: torrentInfo.stat,
                    stat_string: torrentInfo.stat_string,
                    hasData: !!torrentInfo.parsedData
                });

                // Проверяем, готов ли торрент (stat 5 = Torrent in db, есть данные)
                if (torrentInfo.stat === 5 && torrentInfo.parsedData) {
                    console.log('[TorznabService] Torrent is ready');
                    break;
                }

                // Если торрент еще обрабатывается, продолжаем ждать
                if (torrentInfo.stat === 1) { // Torrent getting info
                    console.log('[TorznabService] Still getting info, waiting...');
                    attempts++;
                    continue;
                }

                // Если есть данные даже при другом статусе, пробуем их использовать
                if (torrentInfo.parsedData) {
                    console.log('[TorznabService] Found data despite status, proceeding...');
                    break;
                }

                attempts++;
            }

            // 3. Находим видео файлы
            const videoFiles = this.findVideoFiles(torrentInfo);

            if (videoFiles.length === 0) {
                // Если не нашли видео файлы, выводим структуру для отладки
                console.error('[TorznabService] No video files found. Torrent info structure:', {
                    hasParsedData: !!torrentInfo.parsedData,
                    parsedDataKeys: torrentInfo.parsedData ? Object.keys(torrentInfo.parsedData) : [],
                    hasFileStats: !!torrentInfo.file_stats,
                    hasFiles: !!torrentInfo.files,
                    torrentInfo: JSON.stringify(torrentInfo, null, 2)
                });
                throw new Error('No video files found in torrent');
            }

            // 4. Выбираем первый видео файл
            const selectedFile = videoFiles[0];
            const encodedPath = encodeURIComponent(selectedFile.path);

            // 5. Формируем стрим-ссылку
            const streamUrl = `${this.torrServerConfig.baseURL}${this.torrServerConfig.streamEndpoint}/${encodedPath}?link=${torrentHash}&index=${selectedFile.id}&play`;

            console.log(`[TorznabService] Stream URL: ${streamUrl}`);
            console.log(`[TorznabService] Selected file: ${selectedFile.name} (${selectedFile.formattedSize})`);

            // 6. Сохраняем информацию о торренте
            this.activeTorrents.set(torrentHash, {
                hash: torrentHash,
                torrentUrl: torrentUrl,
                addedAt: new Date().toISOString(),
                info: torrentInfo,
                files: videoFiles,
                selectedFile: selectedFile,
                options: options
            });

            return {
                success: true,
                torrentId: torrentHash,
                torrentHash: torrentHash,
                streamUrl: streamUrl,
                files: videoFiles,
                selectedFile: selectedFile,
                message: 'Torrent added successfully'
            };

        } catch (error) {
            console.error('[TorznabService] Error adding torrent:', error);
            throw new Error(`Failed to add torrent: ${error.message}`);
        }
    }

    /**
     * Поиск торрентов на всех трекерах
     */
    async searchTorrents(query) {
        const cacheKey = `search:${query}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log(`[TorznabService] Using cached results for: ${query}`);
            return cached;
        }

        console.log(`[TorznabService] Searching all trackers for: ${query}`);

        const searchPromises = [];

        for (const [trackerId, tracker] of Object.entries(this.trackers)) {
            if (tracker.enabled) {
                searchPromises.push(
                    this.searchOnTracker(trackerId, tracker, query)
                        .then(results => ({ trackerId, results, success: true }))
                        .catch(error => {
                            console.error(`[TorznabService] Error searching ${tracker.name}:`, error.message);
                            return { trackerId, results: [], success: false, error: error.message };
                        })
                );
            }
        }

        const results = await Promise.all(searchPromises);

        let allResults = [];
        results.forEach(result => {
            if (result.success && result.results.length > 0) {
                allResults = allResults.concat(result.results);
            }
        });

        const formattedResults = this.formatResults(allResults);
        this.setToCache(cacheKey, formattedResults);

        return formattedResults;
    }

    /**
     * Поиск на конкретном трекере
     */
    async searchOnTracker(trackerId, tracker, query) {
        const encodedQuery = encodeURIComponent(query);
        let url = `${tracker.endpoint}?query=${encodedQuery}`;

        console.log(`[TorznabService] Searching ${tracker.name}: ${tracker.baseURL}${url}`);

        try {
            const response = await this.clients[trackerId].get(url);

            if (!response.data) {
                return [];
            }

            if (trackerId === 'rutor') {
                return this.transformRutorResponse(response.data, tracker.name, tracker);
            } else {
                return this.transformTorznabResponse(response.data, tracker.name, tracker);
            }
        } catch (error) {
            console.error(`[TorznabService] Error searching ${tracker.name}:`, error.message);
            throw error;
        }
    }

    /**
     * Проверка здоровья трекеров
     */
    async healthCheck() {
        const healthStatus = {};

        for (const [trackerId, tracker] of Object.entries(this.trackers)) {
            if (tracker.enabled) {
                try {
                    const startTime = Date.now();
                    await this.clients[trackerId].get(`${tracker.endpoint}?query=test`, {
                        timeout: 5000
                    });
                    const responseTime = Date.now() - startTime;

                    healthStatus[trackerId] = {
                        status: 'healthy',
                        name: tracker.name,
                        url: tracker.baseURL,
                        responseTime: `${responseTime}ms`
                    };
                } catch (error) {
                    healthStatus[trackerId] = {
                        status: 'unhealthy',
                        name: tracker.name,
                        url: tracker.baseURL,
                        error: error.message
                    };
                }
            } else {
                healthStatus[trackerId] = {
                    status: 'disabled',
                    name: tracker.name
                };
            }
        }

        const isHealthy = Object.values(healthStatus).some(s => s.status === 'healthy');

        return {
            success: isHealthy,
            status: isHealthy ? 'healthy' : 'unhealthy',
            trackers: healthStatus,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Добавление торрента в TorrServer
     */
    async addTorrentToTorrServer(torrentUrl, options = {}) {
        try {
            console.log(`[TorznabService] Adding torrent to TorrServer: ${torrentUrl}`);

            const addUrl = `${this.torrServerConfig.baseURL}${this.torrServerConfig.torrentsEndpoint}`;

            const payload = {
                action: 'add',
                link: torrentUrl,
                title: options.title || 'Unknown',
                save_to_db: true
            };

            console.log(`[TorznabService] POST to ${addUrl}`, payload);

            const response = await axios.post(addUrl, payload, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`[TorznabService] Add response:`, response.data);

            // Если в ответе есть data поле с JSON строкой, парсим его
            if (response.data && response.data.data && typeof response.data.data === 'string') {
                try {
                    const parsedData = JSON.parse(response.data.data);
                    response.data.parsedData = parsedData;
                    console.log('[TorznabService] Parsed data field');
                } catch (e) {
                    console.error('[TorznabService] Error parsing data field:', e);
                }
            }

            return response.data;

        } catch (error) {
            console.error('[TorznabService] Error adding torrent to TorrServer:', error.response?.data || error.message);
            throw new Error(`Failed to add torrent: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Парсинг ответа от сервера после добавления торрента
     * @param {any} responseData - ответ от сервера
     * @param {string} torrentUrl - оригинальный URL
     * @returns {Object} - информация о торренте
     */
    async parseTorrentAdditionResponse(responseData, torrentUrl) {
        // Пытаемся извлечь информацию из разных форматов ответа
        try {
            // Если ответ - JSON
            if (typeof responseData === 'object') {
                return {
                    hash: responseData.hash || responseData.info_hash,
                    name: responseData.name,
                    files: responseData.files || [],
                    size: responseData.size,
                    status: 'added'
                };
            }

            // Если ответ - HTML или текст, пытаемся извлечь hash
            if (typeof responseData === 'string') {
                // Ищем hash в строке (40 символов hex)
                const hashMatch = responseData.match(/[a-fA-F0-9]{40}/);
                if (hashMatch) {
                    return {
                        hash: hashMatch[0],
                        torrentUrl: torrentUrl,
                        status: 'added',
                        message: 'Torrent added successfully'
                    };
                }
            }

            // Если не удалось распарсить, возвращаем базовую информацию
            return {
                torrentUrl: torrentUrl,
                status: 'added',
                message: 'Torrent added, but could not parse response'
            };

        } catch (error) {
            console.error('[TorznabService] Error parsing response:', error);
            return {
                torrentUrl: torrentUrl,
                status: 'added',
                message: 'Torrent added successfully'
            };
        }
    }

    /**
     * Поиск видео файлов в информации о торренте
     */
    findVideoFiles(torrentInfo) {
        const videoExtensions = ['.avi', '.mkv', '.mp4', '.mov', '.m4v', '.mpg', '.mpeg', '.webm', '.ts'];
        const files = [];

        // Проверяем наличие parsedData (из поля data)
        if (torrentInfo.parsedData && torrentInfo.parsedData.TorrServer && torrentInfo.parsedData.TorrServer.Files) {
            const torrServerFiles = torrentInfo.parsedData.TorrServer.Files;
            console.log('[TorznabService] Found files in parsedData:', torrServerFiles);

            torrServerFiles.forEach(file => {
                const fileName = file.path.split('/').pop().toLowerCase();
                if (videoExtensions.some(ext => fileName.endsWith(ext))) {
                    files.push({
                        id: file.id,
                        path: file.path,
                        name: file.path.split('/').pop(),
                        size: file.length,
                        formattedSize: this.formatSize(file.length)
                    });
                }
            });
        }

        // Проверяем наличие file_stats (старый формат)
        if (files.length === 0 && torrentInfo.file_stats && Array.isArray(torrentInfo.file_stats)) {
            console.log('[TorznabService] Found files in file_stats:', torrentInfo.file_stats);

            torrentInfo.file_stats.forEach(file => {
                const fileName = file.path.split('/').pop().toLowerCase();
                if (videoExtensions.some(ext => fileName.endsWith(ext))) {
                    files.push({
                        id: file.id,
                        path: file.path,
                        name: file.path.split('/').pop(),
                        size: file.length,
                        formattedSize: this.formatSize(file.length)
                    });
                }
            });
        }

        // Проверяем наличие files (альтернативный формат)
        if (files.length === 0 && torrentInfo.files && Array.isArray(torrentInfo.files)) {
            console.log('[TorznabService] Found files in files:', torrentInfo.files);

            torrentInfo.files.forEach(file => {
                const fileName = file.path.split('/').pop().toLowerCase();
                if (videoExtensions.some(ext => fileName.endsWith(ext))) {
                    files.push({
                        id: file.id || file.index,
                        path: file.path,
                        name: file.path.split('/').pop(),
                        size: file.length || file.size,
                        formattedSize: this.formatSize(file.length || file.size)
                    });
                }
            });
        }

        console.log(`[TorznabService] Found ${files.length} video files`);
        return files;
    }

    /**
     * Трансформация стандартного Torznab ответа (Kinozal)
     */
    transformTorznabResponse(data, trackerName, tracker) {
        if (!Array.isArray(data)) {
            return [];
        }

        return data.map(item => {
            let downloadUrl = item.Link;

            if (downloadUrl && !downloadUrl.startsWith('http')) {
                downloadUrl = `${tracker.baseURL}${downloadUrl}`;
            }

            return {
                ...item,
                tracker: trackerName,
                trackerId: 'torznab',
                downloadUrl: downloadUrl,
                sizeBytes: this.parseSizeToBytes(item.Size),
                formattedSize: this.formatSize(this.parseSizeToBytes(item.Size)),
                quality: this.extractQuality(item.Title),
                qualityRank: this.getQualityRank(this.extractQuality(item.Title)),
                audioTracks: this.extractAudioTracks(item.Title),
                type: this.extractType(item.Title),
                formattedDate: this.formatDate(item.CreateDate),
                hasSeeders: (item.Seed || 0) > 0
            };
        });
    }

    /**
     * Трансформация ответа RuTor
     */
    transformRutorResponse(data, trackerName, tracker) {
        if (!Array.isArray(data)) {
            return [];
        }

        return data.map(item => {
            let downloadUrl = null;
            let magnetUrl = null;

            if (item.Magnet) {
                magnetUrl = item.Magnet;
                downloadUrl = item.Magnet;
            } else if (item.Link) {
                downloadUrl = `${tracker.baseURL}${item.Link}`;
            }

            return {
                Title: item.Title,
                Name: item.Name,
                Size: item.Size,
                CreateDate: item.CreateDate,
                Link: downloadUrl,
                Magnet: magnetUrl,
                Peer: item.Peer,
                Seed: item.Seed,
                Hash: item.Hash,
                IMDBID: item.IMDBID,
                Year: item.Year,
                tracker: trackerName,
                trackerId: 'rutor',
                sizeBytes: this.parseSizeToBytes(item.Size),
                formattedSize: this.formatSize(this.parseSizeToBytes(item.Size)),
                quality: this.extractQuality(item.Title),
                qualityRank: this.getQualityRank(this.extractQuality(item.Title)),
                audioTracks: this.extractAudioTracks(item.Title),
                type: this.extractType(item.Title),
                formattedDate: this.formatDate(item.CreateDate),
                hasSeeders: (item.Seed || 0) > 0,
                downloadUrl: magnetUrl || downloadUrl,
                originalLink: item.Link
            };
        });
    }

    /**
     * Форматирование всех результатов
     */
    formatResults(results) {
        return results.sort((a, b) => {
            const priorityA = this.getTrackerPriority(a.trackerId);
            const priorityB = this.getTrackerPriority(b.trackerId);
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return (b.Seed || 0) - (a.Seed || 0);
        });
    }

    /**
     * Получение приоритета трекера
     */
    getTrackerPriority(trackerId) {
        const priorities = {
            'rutor': 1,
            'torznab': 2
        };
        return priorities[trackerId] || 99;
    }

    /**
     * Парсинг размера из строки в байты
     */
    parseSizeToBytes(sizeStr) {
        if (!sizeStr) return 0;

        const match = sizeStr.match(/([\d.]+)\s*([GMK]?)Ci?B/);
        if (!match) {
            const simpleMatch = sizeStr.match(/([\d.]+)\s*([GMK]?)B/);
            if (simpleMatch) {
                const size = parseFloat(simpleMatch[1]);
                const unit = simpleMatch[2].toUpperCase();
                switch (unit) {
                    case 'G': return Math.round(size * 1024 * 1024 * 1024);
                    case 'M': return Math.round(size * 1024 * 1024);
                    case 'K': return Math.round(size * 1024);
                    default: return Math.round(size);
                }
            }
            return 0;
        }

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
     */
    formatSize(bytes) {
        if (bytes >= 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        } else if (bytes >= 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        } else if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }
        return `${bytes} B`;
    }

    /**
     * Извлечение качества из названия
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
     * Получение рейтинга качества
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
     * Извлечение аудио дорожек
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
     * Построение поискового запроса
     */
    buildSearchQuery(movieData) {
        const { title, original_title, release_date, year } = movieData;

        let queryParts = [];

        if (title) {
            queryParts.push(title);
        }

        if (original_title && original_title !== title) {
            queryParts.push(original_title);
        }

        let movieYear = year;
        if (!movieYear && release_date) {
            movieYear = new Date(release_date).getFullYear();
        }

        if (movieYear && !isNaN(movieYear)) {
            queryParts.push(movieYear.toString());
        }

        return queryParts.join(' ').trim();
    }

    /**
     * Получение из кэша
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            return cached.data;
        }
        return null;
    }

    /**
     * Сохранение в кэш
     */
    setToCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });

        if (this.cache.size > 100) {
            const oldestKey = Array.from(this.cache.keys())
                .reduce((oldest, current) => {
                    return this.cache.get(current).timestamp < this.cache.get(oldest).timestamp ? current : oldest;
                });
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Очистка кэша
     */
    clearCache() {
        this.cache.clear();
        console.log('[TorznabService] Cache cleared');
    }

    /**
     * Получение статуса торрента
     */
    getTorrentStatus(torrentId) {
        const torrent = this.activeTorrents.get(torrentId);
        if (!torrent) {
            return {
                success: false,
                error: 'Torrent not found'
            };
        }

        return {
            success: true,
            torrent: torrent
        };
    }

    /**
     * Получение списка активных торрентов
     */
    getActiveTorrents() {
        return Array.from(this.activeTorrents.values());
    }

    /**
     * Получение стрим-ссылки для существующего торрента
     */
    getStreamUrl(torrentHash, fileIndex = 1, filePath = null) {
        if (filePath) {
            const encodedPath = encodeURIComponent(filePath);
            return `${this.torrServerConfig.baseURL}${this.torrServerConfig.streamEndpoint}/${encodedPath}?link=${torrentHash}&index=${fileIndex}&play`;
        }
        return `${this.torrServerConfig.baseURL}${this.torrServerConfig.streamEndpoint}/?link=${torrentHash}&index=${fileIndex}&play`;
    }

    /**
     * Построение стрим-ссылки
     * @param {string} hash - хеш торрента
     * @param {number} fileIndex - индекс файла
     * @returns {string} - стрим-ссылка
     */
    buildStreamUrl(hash, fileIndex = 1) {
        return `${this.streamConfig.baseURL}${this.streamConfig.streamEndpoint}/?link=${hash}&index=${fileIndex}&play`;
    }

    /**
     * Очистка старых торрентов (старше указанного времени)
     * @param {number} maxAgeMs - максимальный возраст в миллисекундах
     */
    cleanupOldTorrents(maxAgeMs = 24 * 60 * 60 * 1000) {
        const now = Date.now();
        for (const [id, torrent] of this.activeTorrents.entries()) {
            const age = now - new Date(torrent.addedAt).getTime();
            if (age > maxAgeMs) {
                this.activeTorrents.delete(id);
                console.log(`[TorznabService] Removed old torrent: ${id}`);
            }
        }
    }

    /**
     * Построение URL для скачивания
     * @param {Object} item - элемент торрента
     * @returns {string} - URL для скачивания
     */
    buildDownloadUrl(item) {
        if (item.Magnet) return item.Magnet;
        if (item.Link) return item.Link;
        return '';
    }
}

// Экспортируем единственный экземпляр сервиса
export default new TorznabService();