// routes/torznab.routes.js
import express from 'express';
import torznabController from '../controllers/torznabController.js';

const router = express.Router();

router.post('/search', torznabController.search);
router.get('/info/:id', torznabController.getTorrentInfo);
router.get('/health', torznabController.healthCheck);
router.get('/stats', torznabController.getStats);
router.get('/check-link', torznabController.checkLink);
router.get('/torrent/:id', torznabController.getTorrentById);
router.post('/cache/clear', torznabController.clearCache);

// Новые роуты для стриминга
router.post('/add-and-stream', torznabController.addAndStream);
router.get('/stream/:torrentId', torznabController.getStream);
router.get('/status/:torrentId', torznabController.getTorrentStatus);
router.get('/active-torrents', torznabController.getActiveTorrents);

router.get('/playlist', torznabController.getPlaylist);
router.delete('/torrent/:hash', torznabController.removeTorrent);
router.get('/stream-file/:hash/:fileId', torznabController.getStreamForFile);
router.get('/playlist/:hash', torznabController.getM3UPlaylist);
router.get('/playlist-info/:hash', torznabController.getPlaylistInfo);

export default router;