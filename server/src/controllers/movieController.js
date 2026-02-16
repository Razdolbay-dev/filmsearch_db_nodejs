import tmdbMovieService from '../services/movieService.js';

/**
 * Контроллер для работы с фильмами
 */
class MovieController {
    /**
     * Получить детали фильма с актерским составом
     */
    async getMovieWithCredits(req, res) {
        try {
            const { id } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID фильма обязателен',
                    timestamp: new Date().toISOString()
                });
            }

            const result = await tmdbMovieService.getMovieWithCredits(id, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    movieId: id,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getMovieWithCredits:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Получить только детали фильма
     */
    async getMovieDetails(req, res) {
        try {
            const { id } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID фильма обязателен'
                });
            }

            const result = await tmdbMovieService.getMovieDetails(id, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    movieId: id
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getMovieDetails:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить только актерский состав
     */
    async getMovieCredits(req, res) {
        try {
            const { id } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID фильма обязателен'
                });
            }

            const result = await tmdbMovieService.getMovieCredits(id, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    movieId: id
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getMovieCredits:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить несколько фильмов
     */
    async getMultipleMovies(req, res) {
        try {
            const { ids } = req.query;
            const { language = 'ru-RU' } = req.query;

            if (!ids) {
                return res.status(400).json({
                    success: false,
                    error: 'Параметр ids обязателен (через запятую)'
                });
            }

            const movieIds = ids.split(',').map(id => id.trim()).filter(id => id);

            if (movieIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный формат IDs'
                });
            }

            // Ограничим количество запросов
            if (movieIds.length > 10) {
                return res.status(400).json({
                    success: false,
                    error: 'Максимально 10 фильмов за один запрос'
                });
            }

            const result = await tmdbMovieService.getMultipleMovies(movieIds, language);

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('❌ Ошибка в контроллере getMultipleMovies:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Поиск фильмов по названию
     */
    async searchMovies(req, res) {
        try {
            const { query, language = 'ru-RU', page = 1 } = req.query;

            if (!query || query.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Параметр query обязателен'
                });
            }

            const result = await tmdbMovieService.searchMovies(query, language, parseInt(page));

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере searchMovies:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Проверить статус API
     */
    async getApiStatus(req, res) {
        try {
            const result = await tmdbMovieService.testConnection();

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('❌ Ошибка в контроллере getApiStatus:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить информацию о прокси
     */
    async getProxyInfo(req, res) {
        try {
            // Предполагаем, что у proxyManager есть метод getProxyInfo()
            const proxyInfo = proxyManager.getProxyInfo();

            res.json({
                success: true,
                data: {
                    proxyEnabled: config.proxy.enabled,
                    proxyInfo: proxyInfo,
                    config: {
                        type: config.proxy.type,
                        host: config.proxy.host,
                        port: config.proxy.port,
                        timeout: config.proxy.timeout,
                        retryCount: config.proxy.retryCount
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Ошибка в контроллере getProxyInfo:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }
}

// Экспортируем экземпляр контроллера
const movieController = new MovieController();
export default movieController;