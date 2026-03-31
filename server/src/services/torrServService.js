import { TorrServerAPI } from '../utils/torrServerApi.js';
import { TorrentParser } from '../utils/torrServParser.js';

class TorrServService {
    constructor() {
        this.torrserverAPI = new TorrServerAPI('http://10.1.0.46:8090');
    }

    /**
     * Получить все торренты с парсингом
     */
    async getAllTorrents() {
        const torrents = await this.torrserverAPI.getAllTorrents();
        return torrents.map(torrent => TorrentParser.parseTorrent(torrent));
    }

    /**
     * Получить только активные торренты
     */
    async getActiveTorrents() {
        const activeTorrents = await this.torrserverAPI.getActiveTorrents();
        return activeTorrents.map(torrent => TorrentParser.parseTorrent(torrent));
    }

    /**
     * Получить торрент по хешу
     */
    async getTorrentByHash(hash) {
        const torrent = await this.torrserverAPI.getTorrentByHash(hash);
        if (!torrent) return null;
        return TorrentParser.parseTorrent(torrent);
    }

    /**
     * Добавить торрент по ссылке (magnet или Torznab)
     */
    async addTorrent(link, options = {}) {
        const { title, category, poster, saveToDb = true } = options;

        if (!link) {
            throw new Error('Link or magnet parameter is required');
        }

        console.log('Adding torrent from link:', link.substring(0, 100) + '...');

        const result = await this.torrserverAPI.addTorrentByMagnet(link, {
            title,
            category,
            poster,
            saveToDb,
        });

        return result;
    }

    /**
     * Добавить торрент по magnet-ссылке
     */
    async addTorrentByMagnet(magnet, options = {}) {
        if (!magnet) {
            throw new Error('Magnet link is required');
        }

        return await this.torrserverAPI.addTorrentByMagnet(magnet, options);
    }

    /**
     * Добавить торрент по .torrent файлу (base64)
     */
    async addTorrentByFile(torrentFile, options = {}) {
        if (!torrentFile) {
            throw new Error('Torrent file (base64) is required');
        }

        return await this.torrserverAPI.addTorrentByFile(torrentFile, options);
    }

    /**
     * Получить статистику торрента
     */
    async getTorrentStats(hash) {
        return await this.torrserverAPI.getTorrentStats(hash);
    }

    /**
     * Удалить торрент (из памяти)
     */
    async removeTorrent(hash) {
        await this.torrserverAPI.removeTorrent(hash);
        return { success: true, hash, action: 'removed' };
    }

    /**
     * Полностью удалить торрент из БД
     */
    async wipeTorrent(hash) {
        await this.torrserverAPI.wipeTorrent(hash);
        return { success: true, hash, action: 'wiped' };
    }

    /**
     * Остановить торрент (drop)
     */
    async dropTorrent(hash) {
        await this.torrserverAPI.dropTorrent(hash);
        return { success: true, hash, action: 'dropped' };
    }

    /**
     * Обновить информацию о торренте
     */
    async updateTorrentInfo(hash, updates) {
        const { title, category, poster, data } = updates;

        const updateData = {};
        if (title) updateData.title = title;
        if (category) updateData.category = category;
        if (poster) updateData.poster = poster;
        if (data) updateData.data = data;

        return await this.torrserverAPI.setTorrentInfo(hash, updateData);
    }

    /**
     * Управление состоянием торрента (start/pause)
     */
    async controlTorrent(hash, action) {
        if (action === 'start') {
            await this.torrserverAPI.startTorrent(hash);
        } else if (action === 'pause') {
            await this.torrserverAPI.pauseTorrent(hash);
        } else {
            throw new Error('Action must be "start" or "pause"');
        }

        return { success: true, hash, action };
    }

    /**
     * Проверка здоровья сервиса
     */
    async healthCheck() {
        const torrserverHealth = await this.torrserverAPI.healthCheck();
        return {
            status: 'ok',
            timestamp: Date.now(),
            torrserver: torrserverHealth
        };
    }

    /**
     * Поиск с приоритетом
     */
    async search(query, options = {}) {
        if (!query) {
            throw new Error('Query parameter is required');
        }

        const { priority = 'rutor', fallback = true, limit = 50, minSeeders = 0 } = options;

        return await this.torrserverAPI.search(query, {
            priority,
            fallback,
            limit,
            minSeeders
        });
    }

    /**
     * Поиск только в RuTor
     */
    async searchRuTor(query) {
        if (!query) {
            throw new Error('Query parameter is required');
        }

        const results = await this.torrserverAPI.searchRuTor(query);
        return {
            query,
            source: 'rutor',
            total: results.length,
            results,
        };
    }

    /**
     * Поиск только в Torznab
     */
    async searchTorznab(query) {
        if (!query) {
            throw new Error('Query parameter is required');
        }

        const results = await this.torrserverAPI.searchTorznab(query);
        return {
            query,
            source: 'torznab',
            total: results.length,
            results,
        };
    }

    /**
     * Добавить торрент из результатов поиска
     */
    async addFromSearch(magnet, options = {}) {
        if (!magnet) {
            throw new Error('Magnet link is required');
        }

        const { title, category, saveToDb = true } = options;

        return await this.torrserverAPI.addTorrentByMagnet(magnet, {
            title,
            category,
            saveToDb,
        });
    }
}

export default TorrServService;