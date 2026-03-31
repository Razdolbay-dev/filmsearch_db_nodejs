import { Router } from 'express';
import TorrServController from '../controllers/torrServController.js';

const router = Router();
const torrServController = new TorrServController();

// Получить список всех торрентов (структурированных)
router.get('/torrents', torrServController.getAllTorrents);
// Получить только активные торренты
router.get('/torrents/active', torrServController.getActiveTorrents);
// Получить структурированный торрент по хешу
router.get('/torrents/:hash', torrServController.getTorrentByHash);
// Универсальный маршрут для добавления торрента (принимает magnet ИЛИ Torznab ссылку)
router.post('/torrents/add', torrServController.addTorrent);
// Добавить торрент по magnet-ссылке
router.post('/torrents/add/magnet', torrServController.addTorrentByMagnet);
// Добавить торрент по .torrent файлу (base64)
router.post('/torrents/add/file', torrServController.addTorrentByFile);
// Получить статистику по торренту
router.get('/torrents/:hash/stats', torrServController.getTorrentStats);
// Удалить торрент (из памяти, но оставить в БД)
router.delete('/torrents/:hash', torrServController.removeTorrent);
// Полностью удалить торрент из БД
router.delete('/torrents/:hash/wipe', torrServController.wipeTorrent);
// Остановить торрент (drop)
router.post('/torrents/:hash/drop', torrServController.dropTorrent);
// Обновить информацию о торренте
router.patch('/torrents/:hash', torrServController.updateTorrentInfo);
// Управление состоянием торрента (start/pause)
router.post('/torrents/:hash/control', torrServController.controlTorrent);
// Здоровье сервиса
router.get('/health', torrServController.healthCheck);
// Поиск с приоритетом RuTor
router.get('/search', torrServController.search);
// Поиск только в RuTor
router.get('/search/rutor', torrServController.searchRuTor);
// Поиск только в Torznab/Jackett
router.get('/search/torznab', torrServController.searchTorznab);
// Добавить торрент из результатов поиска по magnet-ссылке
router.post('/search/add', torrServController.addFromSearch);

export default router;