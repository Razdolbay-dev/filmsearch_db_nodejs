import seriesService from '../services/seriesService.js';

/**
 * Контроллер для работы с сериалами
 */
class SeriesController {
    /**
     * Получить детали сериала
     */
    async getSeriesDetails(req, res) {
        try {
            const { id } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала обязателен'
                });
            }

            const result = await seriesService.getSeriesDetails(id, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getSeriesDetails:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить полную информацию о сериале
     */
    async getFullSeriesInfo(req, res) {
        try {
            const { id } = req.params;
            const {
                language = 'ru-RU',
                includeSeasons = 'true',
                includeEpisodes = 'true',
                includeFullEpisodes = 'false',
                maxConcurrent = '5',
                includeCredits = 'true',
                includeRecommendations = 'true',
                includeSimilar = 'false',
                includeContentRatings = 'true',
                includeVideos = 'false',
                includeKeywords = 'false',
                includeReviews = 'false',
                includeWatchProviders = 'false'
            } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала обязателен'
                });
            }

            const options = {
                includeSeasons: includeSeasons === 'true',
                includeEpisodes: includeEpisodes === 'true',
                includeFullEpisodes: includeFullEpisodes === 'true',
                maxConcurrent: parseInt(maxConcurrent) || 5,
                includeCredits: includeCredits === 'true',
                includeRecommendations: includeRecommendations === 'true',
                includeSimilar: includeSimilar === 'true',
                includeContentRatings: includeContentRatings === 'true',
                includeVideos: includeVideos === 'true',
                includeKeywords: includeKeywords === 'true',
                includeReviews: includeReviews === 'true',
                includeWatchProviders: includeWatchProviders === 'true'
            };

            // Валидация параметров
            if (options.maxConcurrent < 1 || options.maxConcurrent > 20) {
                return res.status(400).json({
                    success: false,
                    error: 'Максимальное количество параллельных запросов должно быть от 1 до 20'
                });
            }

            const result = await seriesService.getFullSeriesInfo(id, language, options);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getFullSeriesInfo:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить детали сезона
     */
    async getSeasonDetails(req, res) {
        try {
            const { id, seasonNumber } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id || !seasonNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала и номер сезона обязательны'
                });
            }

            const result = await seriesService.getSeasonDetails(id, seasonNumber, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id,
                    seasonNumber
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getSeasonDetails:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить детали эпизода
     */
    async getEpisodeDetails(req, res) {
        try {
            const { id, seasonNumber, episodeNumber } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id || !seasonNumber || !episodeNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала, номер сезона и номер эпизода обязательны'
                });
            }

            const result = await seriesService.getEpisodeDetails(id, seasonNumber, episodeNumber, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id,
                    seasonNumber,
                    episodeNumber
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getEpisodeDetails:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить полный сезон
     */
    async getFullSeason(req, res) {
        try {
            const { id, seasonNumber } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id || !seasonNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала и номер сезона обязательны'
                });
            }

            const result = await seriesService.getFullSeason(id, seasonNumber, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id,
                    seasonNumber
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getFullSeason:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить все сезоны сериала
     */
    async getAllSeasons(req, res) {
        try {
            const { id } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала обязателен'
                });
            }

            const result = await seriesService.getAllSeasons(id, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getAllSeasons:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить все эпизоды сезона
     */
    async getAllEpisodes(req, res) {
        try {
            const { id, seasonNumber } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id || !seasonNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала и номер сезона обязательны'
                });
            }

            const result = await seriesService.getAllEpisodes(id, seasonNumber, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id,
                    seasonNumber
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getAllEpisodes:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Поиск сериалов
     */
    async searchSeries(req, res) {
        try {
            const { query, language = 'ru-RU', page = 1 } = req.query;

            if (!query || query.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Параметр query обязателен'
                });
            }

            const result = await seriesService.searchSeries(query, language, parseInt(page));

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
            console.error('❌ Ошибка в контроллере searchSeries:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Популярные сериалы
     */
    async getPopularSeries(req, res) {
        try {
            const { language = 'ru-RU', page = 1 } = req.query;

            const result = await seriesService.getPopularSeries(language, parseInt(page));

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
            console.error('❌ Ошибка в контроллере getPopularSeries:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Сериалы в эфире
     */
    async getOnTheAirSeries(req, res) {
        try {
            const { language = 'ru-RU', page = 1 } = req.query;

            const result = await seriesService.getOnTheAirSeries(language, parseInt(page));

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
            console.error('❌ Ошибка в контроллере getOnTheAirSeries:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить актерский состав сериала
     */
    async getSeriesCredits(req, res) {
        try {
            const { id } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала обязателен'
                });
            }

            const result = await seriesService.getSeriesCredits(id, language);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getSeriesCredits:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить похожие сериалы
     */
    async getSimilarSeries(req, res) {
        try {
            const { id } = req.params;
            const { language = 'ru-RU', page = 1 } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала обязателен'
                });
            }

            const result = await seriesService.getSimilarSeries(id, language, parseInt(page));

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getSimilarSeries:', error);

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
            const result = await seriesService.testConnection();

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
     * Получить сезон с полной информацией об эпизодах
     */
    async getSeasonWithFullEpisodes(req, res) {
        try {
            const { id, seasonNumber } = req.params;
            const { language = 'ru-RU' } = req.query;

            if (!id || !seasonNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала и номер сезона обязательны'
                });
            }

            const result = await seriesService.getSeasonWithFullEpisodes(
                id,
                parseInt(seasonNumber),
                language
            );

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id,
                    seasonNumber
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getSeasonWithFullEpisodes:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }

    /**
     * Получить все сезоны с эпизодами
     */
    async getAllSeasonsWithEpisodes(req, res) {
        try {
            const { id } = req.params;
            const {
                language = 'ru-RU',
                includeFullEpisodes = 'false'
            } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID сериала обязателен'
                });
            }

            const result = await seriesService.getAllSeasonsWithEpisodes(
                id,
                language,
                includeFullEpisodes === 'true'
            );

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                    seriesId: id
                });
            }

        } catch (error) {
            console.error('❌ Ошибка в контроллере getAllSeasonsWithEpisodes:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }
}

// Экспортируем экземпляр контроллера
const seriesController = new SeriesController();
export default seriesController;