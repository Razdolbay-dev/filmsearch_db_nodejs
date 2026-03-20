// controllers/torznab.controller.js
import torznabService from '../services/torznabService.js';

class TorznabController {
    /**
     * Поиск торрентов
     * POST /api/torznab/search
     */
    async search(req, res) {
        try {
            const { query, title, original_title, year, release_date } = req.body;

            // Формируем поисковый запрос
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

            // Выполняем поиск
            const results = await torznabService.searchTorrents(searchQuery);

            // Возвращаем успешный ответ
            return res.status(200).json({
                success: true,
                query: searchQuery,
                results: results,
                count: results.length,
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
     * Проверка доступности Torznab сервера
     * GET /api/torznab/health
     */
    async healthCheck(req, res) {
        try {
            // Пытаемся выполнить простой поиск для проверки
            const testResults = await torznabService.searchTorrents('test');

            return res.status(200).json({
                success: true,
                status: 'healthy',
                server: process.env.TORZNAB_URL || 'http://10.1.0.46:8090',
                responseTime: Date.now() - req.startTime,
                timestamp: new Date().toISOString()
            });

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
}

// Экспортируем единственный экземпляр контроллера
export default new TorznabController();