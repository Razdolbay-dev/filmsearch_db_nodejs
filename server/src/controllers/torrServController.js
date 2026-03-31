import TorrServService from '../services/torrServService.js';

class TorrServController {
    constructor() {
        this.torrServService = new TorrServService();
    }

    /**
     * Получить список всех торрентов
     */
    getAllTorrents = async (req, res) => {
        try {
            const torrents = await this.torrServService.getAllTorrents();
            res.json(torrents);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Получить только активные торренты
     */
    getActiveTorrents = async (req, res) => {
        try {
            const activeTorrents = await this.torrServService.getActiveTorrents();
            res.json(activeTorrents);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Получить структурированный торрент по хешу
     */
    getTorrentByHash = async (req, res) => {
        try {
            const { hash } = req.params;
            const torrent = await this.torrServService.getTorrentByHash(hash);

            if (!torrent) {
                return res.status(404).json({ error: 'Torrent not found' });
            }

            res.json(torrent);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Универсальный маршрут для добавления торрента
     */
    addTorrent = async (req, res) => {
        try {
            const { link, magnet, title, category, saveToDb = true } = req.body;
            const torrentLink = link || magnet;

            const result = await this.torrServService.addTorrent(torrentLink, {
                title,
                category,
                saveToDb,
            });

            res.json({
                success: true,
                result,
                message: 'Torrent added successfully',
            });
        } catch (error) {
            console.error('Error adding torrent:', error.message);

            if (error.response?.status === 400) {
                res.status(400).json({
                    error: 'TorrServer rejected the request',
                    details: error.response?.data,
                    suggestion: 'Check if the link is valid or if the torrent already exists'
                });
            } else {
                res.status(500).json({
                    error: error.message,
                    suggestion: 'Make sure the link is a valid magnet or Torznab link'
                });
            }
        }
    };

    /**
     * Добавить торрент по magnet-ссылке
     */
    addTorrentByMagnet = async (req, res) => {
        try {
            const { magnet, title, category, poster, saveToDb } = req.body;
            const result = await this.torrServService.addTorrentByMagnet(magnet, {
                title,
                category,
                poster,
                saveToDb
            });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Добавить торрент по .torrent файлу (base64)
     */
    addTorrentByFile = async (req, res) => {
        try {
            const { torrentFile, title, category, poster, saveToDb } = req.body;
            const result = await this.torrServService.addTorrentByFile(torrentFile, {
                title,
                category,
                poster,
                saveToDb
            });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Получить статистику по торренту
     */
    getTorrentStats = async (req, res) => {
        try {
            const { hash } = req.params;
            const stats = await this.torrServService.getTorrentStats(hash);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Удалить торрент (из памяти, но оставить в БД)
     */
    removeTorrent = async (req, res) => {
        try {
            const { hash } = req.params;
            const result = await this.torrServService.removeTorrent(hash);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Полностью удалить торрент из БД
     */
    wipeTorrent = async (req, res) => {
        try {
            const { hash } = req.params;
            const result = await this.torrServService.wipeTorrent(hash);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Остановить торрент (drop)
     */
    dropTorrent = async (req, res) => {
        try {
            const { hash } = req.params;
            const result = await this.torrServService.dropTorrent(hash);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Обновить информацию о торренте
     */
    updateTorrentInfo = async (req, res) => {
        try {
            const { hash } = req.params;
            const { title, category, poster, data } = req.body;

            const result = await this.torrServService.updateTorrentInfo(hash, {
                title,
                category,
                poster,
                data
            });

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Управление состоянием торрента (start/pause)
     */
    controlTorrent = async (req, res) => {
        try {
            const { hash } = req.params;
            const { action } = req.body;

            const result = await this.torrServService.controlTorrent(hash, action);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Здоровье сервиса
     */
    healthCheck = async (req, res) => {
        const health = await this.torrServService.healthCheck();
        res.json(health);
    };

    /**
     * Поиск с приоритетом RuTor
     */
    search = async (req, res) => {
        try {
            const { q, query, limit, minSeeders, priority, fallback } = req.query;
            const searchQuery = q || query;

            const results = await this.torrServService.search(searchQuery, {
                priority,
                fallback: fallback !== 'false',
                limit: limit ? parseInt(limit) : 50,
                minSeeders: minSeeders ? parseInt(minSeeders) : 0,
            });

            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Поиск только в RuTor
     */
    searchRuTor = async (req, res) => {
        try {
            const { q, query } = req.query;
            const searchQuery = q || query;

            const results = await this.torrServService.searchRuTor(searchQuery);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Поиск только в Torznab/Jackett
     */
    searchTorznab = async (req, res) => {
        try {
            const { q, query } = req.query;
            const searchQuery = q || query;

            const results = await this.torrServService.searchTorznab(searchQuery);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    /**
     * Добавить торрент из результатов поиска по magnet-ссылке
     */
    addFromSearch = async (req, res) => {
        try {
            const { magnet, title, category, saveToDb = true } = req.body;

            const result = await this.torrServService.addFromSearch(magnet, {
                title,
                category,
                saveToDb,
            });

            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

export default TorrServController;