import express from "express";
import exportsRoutes from "./exportsRoutes.js";
import config from '../config/index.js';
import tmdbMovieRoutes from "./movieRoutes.js";
const router = express.Router();

// Маршрут для проверки конфигурации (опционально)
router.get('/config/status', (req, res) => {
    res.json({
        status: 'ok',
        server: `${config.app.host}:${config.app.port}`,
        database: {
            connected: !!config.database.username,
            host: config.database.host,
            name: config.database.name
        },
        tmdb: {
            configured: !!config.tmdb.apiKey
        },
        proxy: {
            enabled: config.proxy.enabled,
            type: config.proxy.type
        }
    });
});
router.use('/exports', exportsRoutes)
router.use('/movies', tmdbMovieRoutes)

export default router;
