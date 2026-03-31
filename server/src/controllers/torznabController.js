// controllers/torznab.controller.js
import torznabService from '../services/torznabService.js';

class TorznabController {
    async search(req, res) {
        try {
            const { query, title, original_title, year, release_date } = req.body;

            let searchQuery = query;

            if (!searchQuery && (title || original_title)) {
                searchQuery = torznabService.buildSearchQuery({
                    title,
                    original_title,
                    year,
                    release_date
                });
            }

            if (!searchQuery) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }

            const results = await torznabService.searchTorrents(searchQuery);

            // Группируем результаты по трекерам для статистики
            const trackerStats = {};
            results.forEach(result => {
                const tracker = result.tracker || 'unknown';
                if (!trackerStats[tracker]) {
                    trackerStats[tracker] = 0;
                }
                trackerStats[tracker]++;
            });

            return res.status(200).json({
                success: true,
                query: searchQuery,
                results: results,
                count: results.length,
                trackers: trackerStats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('[TorznabController] Search error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to search torrents',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async healthCheck(req, res) {
        try {
            const health = await torznabService.healthCheck();

            return res.status(health.success ? 200 : 503).json(health);

        } catch (error) {
            console.error('[TorznabController] Health check failed:', error);

            return res.status(503).json({
                success: false,
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async clearCache(req, res) {
        try {
            torznabService.clearCache();

            return res.status(200).json({
                success: true,
                message: 'Cache cleared successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Проверка доступности ссылки
     * GET /api/torznab/check-link
     */
    async checkLink(req, res) {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    success: false,
                    error: 'URL is required'
                });
            }

            // Проверяем, является ли URL magnet-ссылкой
            if (url.startsWith('magnet:')) {
                return res.status(200).json({
                    success: true,
                    type: 'magnet',
                    url: url,
                    valid: true
                });
            }

            // Для HTTP ссылок проверяем доступность
            try {
                const response = await axios.head(url, {
                    timeout: 5000,
                    validateStatus: (status) => status < 400
                });

                return res.status(200).json({
                    success: true,
                    type: 'http',
                    url: url,
                    valid: true,
                    status: response.status
                });
            } catch (error) {
                return res.status(200).json({
                    success: true,
                    type: 'http',
                    url: url,
                    valid: false,
                    error: error.message
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Получение информации о торренте по ID (для RuTor)
     * GET /api/torznab/torrent/:id
     */
    async getTorrentById(req, res) {
        try {
            const { id } = req.params;
            const { tracker } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Torrent ID is required'
                });
            }

            // Формируем URL для RuTor
            const torrentUrl = `http://10.1.0.46:8090/torrent/${id}`;

            // Здесь можно добавить логику для получения информации о торренте
            // Например, парсинг страницы торрента для получения magnet-ссылки

            return res.status(200).json({
                success: true,
                torrentId: id,
                tracker: tracker || 'rutor',
                url: torrentUrl,
                message: 'Use this URL to access the torrent page'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Получение информации о торренте
     * GET /api/torznab/info/:id
     */
    async getTorrentInfo(req, res) {
        try {
            const { id } = req.params;
            const { link } = req.query;

            if (!id && !link) {
                return res.status(400).json({
                    success: false,
                    error: 'Torrent ID or link is required'
                });
            }

            // Здесь можно добавить логику получения дополнительной информации
            // Например, проверка доступности ссылки или получение magnet-ссылки

            return res.status(200).json({
                success: true,
                message: 'Info endpoint - to be implemented',
                torrentId: id,
                link: link
            });

        } catch (error) {
            console.error('[TorznabController] Get info error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to get torrent info',
                message: error.message
            });
        }
    }

    /**
     * Получение статистики по поиску
     * GET /api/torznab/stats
     */
    async getStats(req, res) {
        try {
            // Здесь можно добавить сбор статистики
            // Например, количество запросов, время ответа и т.д.

            return res.status(200).json({
                success: true,
                stats: {
                    // Статистика будет собираться в будущем
                    message: 'Stats endpoint - to be implemented'
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('[TorznabController] Get stats error:', error);

            return res.status(500).json({
                success: false,
                error: 'Failed to get statistics',
                message: error.message
            });
        }
    }

    /**
     * Добавление торрента и получение стрим-ссылки
     * POST /api/torznab/add-and-stream
     */
    async addAndStream(req, res) {
        try {
            const { torrentUrl, title, quality, tracker } = req.body;

            if (!torrentUrl) {
                return res.status(400).json({
                    success: false,
                    error: 'Torrent URL is required'
                });
            }

            const result = await torznabService.addTorrentAndGetStream(torrentUrl, {
                title,
                quality,
                tracker
            });

            return res.status(200).json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('[TorznabController] Add and stream error:', error);

            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Получение стрим-ссылки для существующего торрента
     * GET /api/torznab/stream/:torrentId
     */
    async getStream(req, res) {
        try {
            const { torrentId } = req.params;
            const { fileIndex } = req.query;

            const streamUrl = torznabService.getStreamUrl(torrentId, fileIndex ? parseInt(fileIndex) : 1);

            return res.status(200).json({
                success: true,
                streamUrl: streamUrl,
                torrentId: torrentId
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Получение статуса торрента
     * GET /api/torznab/status/:torrentId
     */
    async getTorrentStatus(req, res) {
        try {
            const { torrentId } = req.params;
            const status = torznabService.getTorrentStatus(torrentId);

            return res.status(200).json(status);

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Получение списка активных торрентов
     * GET /api/torznab/active-torrents
     */
    async getActiveTorrents(req, res) {
        try {
            const torrents = torznabService.getActiveTorrents();

            return res.status(200).json({
                success: true,
                torrents: torrents,
                count: torrents.length
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Получение списка активных торрентов
     * GET /api/torznab/playlist
     */
    async getPlaylist(req, res) {
        try {
            const playlist = await torznabService.getTorrentsList();

            return res.status(200).json({
                success: true,
                ...playlist
            });

        } catch (error) {
            console.error('[TorznabController] Get playlist error:', error);

            return res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Удаление торрента
     * DELETE /api/torznab/torrent/:hash
     */
    async removeTorrent(req, res) {
        try {
            const { hash } = req.params;

            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Torrent hash is required'
                });
            }

            const result = await torznabService.removeTorrent(hash);

            return res.status(200).json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('[TorznabController] Remove torrent error:', error);

            return res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Получение стрим-ссылки для файла торрента
     * GET /api/torznab/stream-file/:hash/:fileId
     */
    async getStreamForFile(req, res) {
        try {
            const { hash, fileId } = req.params;
            const { filePath } = req.query;

            if (!hash || !fileId) {
                return res.status(400).json({
                    success: false,
                    error: 'Hash and fileId are required'
                });
            }

            // Получаем информацию о торренте
            const torrentInfo = await torznabService.getTorrentInfo(hash);
            const videoFiles = torznabService.findVideoFiles(torrentInfo);

            const file = videoFiles.find(f => f.id === parseInt(fileId));
            if (!file) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found'
                });
            }

            const streamUrl = torznabService.getTorrentStreamUrl(hash, file.id, file.path);

            return res.status(200).json({
                success: true,
                hash: hash,
                file: file,
                streamUrl: streamUrl,
                message: 'Stream URL generated successfully'
            });

        } catch (error) {
            console.error('[TorznabController] Get stream for file error:', error);

            return res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Получение M3U плейлиста для торрента
     * GET /api/torznab/playlist/:hash
     */
    async getM3UPlaylist(req, res) {
        try {
            const { hash } = req.params;
            const { files } = req.query; // Опционально: список ID файлов через запятую

            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Torrent hash is required'
                });
            }

            let m3uContent;

            if (files) {
                // Создаем кастомный плейлист с выбранными файлами
                const fileIds = files.split(',').map(id => parseInt(id));
                m3uContent = await torznabService.getCustomM3UPlaylist(hash, fileIds);
            } else {
                // Получаем стандартный плейлист
                m3uContent = await torznabService.getM3UPlaylist(hash);
            }

            // Устанавливаем заголовки для M3U файла
            res.setHeader('Content-Type', 'audio/x-mpegurl');
            res.setHeader('Content-Disposition', `attachment; filename="torrent_${hash}.m3u"`);

            return res.send(m3uContent);

        } catch (error) {
            console.error('[TorznabController] Get M3U playlist error:', error);

            return res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Получение информации о файлах для M3U плейлиста
     * GET /api/torznab/playlist-info/:hash
     */
    async getPlaylistInfo(req, res) {
        try {
            const { hash } = req.params;

            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Torrent hash is required'
                });
            }

            // Получаем информацию о торренте
            const torrentInfo = await torznabService.getTorrentInfo(hash);
            const videoFiles = torznabService.findVideoFiles(torrentInfo);

            // Формируем информацию для плейлиста
            const playlistInfo = {
                hash: hash,
                title: torrentInfo.title || torrentInfo.name || 'Unknown',
                totalFiles: videoFiles.length,
                totalSize: torrentInfo.torrent_size,
                formattedTotalSize: torznabService.formatSize(torrentInfo.torrent_size),
                files: videoFiles.map(file => ({
                    id: file.id,
                    name: file.name,
                    size: file.size,
                    formattedSize: file.formattedSize,
                    streamUrl: torznabService.getTorrentStreamUrl(hash, file.id, file.path),
                    duration: file.duration || 0
                })),
                playlistUrl: `${req.protocol}://${req.get('host')}/api/torznab/playlist/${hash}`,
                timestamp: new Date().toISOString()
            };

            return res.status(200).json({
                success: true,
                ...playlistInfo
            });

        } catch (error) {
            console.error('[TorznabController] Get playlist info error:', error);

            return res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

}

export default new TorznabController();