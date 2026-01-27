import express from "express";

import exportsRoutes from "./exportsRoutes.js";
import tmdbMovieRoutes from "./movieRoutes.js";
import tmdbSeriesRoutes from "./seriesRoutes.js";
import infoRoutes from "./infoRoutes.js";

const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        message: 'TMDB API Proxy Service',
        version: '1.0.0',
        documentation: '/api/info',
        quick_links: {
            health_check: '/health',
            service_info: '/api/info/service',
            movies_api: '/api/movies/550',
            series_api: '/api/series/1399',
            search_movies: '/api/movies/search?query=матрица',
            search_series: '/api/series/search?query=во+все'
        },
        examples: [
            'curl "http://localhost:5000/health"',
            'curl "http://localhost:5000/api/movies/550"',
            'curl "http://localhost:5000/api/series/1399"'
        ],
        timestamp: new Date().toISOString()
    });
});
// Маршрут для проверки конфигурации (опционально)
router.use('/exports', exportsRoutes)
router.use('/movies', tmdbMovieRoutes)
router.use('/series', tmdbSeriesRoutes)
router.use('/info', infoRoutes)
export default router;
