import trendingTMDBService from '../services/trendingTMDBService.js';
import MoviesService from '../services/moviesService.js';
import SeriesService from '../services/seriesService.js';

class TrendingController {
    constructor() {
        // Сохраняем сервисы как свойства класса
        this.moviesService = new MoviesService();
        this.seriesService = new SeriesService();
        this.trendingTMDBService = trendingTMDBService;

        // Привязываем методы к экземпляру класса
        this.getTrendingMovies = this.getTrendingMovies.bind(this);
        this.getTrendingSeries = this.getTrendingSeries.bind(this);
        this.getTrendingMoviesFromTMDB = this.getTrendingMoviesFromTMDB.bind(this);
        this.getTrendingSeriesFromTMDB = this.getTrendingSeriesFromTMDB.bind(this);
        this.healthCheck = this.healthCheck.bind(this);
    }

    /**
     * Получить трендовые фильмы из базы данных
     * GET /api/movies/trending
     */
    async getTrendingMovies(req, res) {
        try {
            const { limit = 20, language = 'ru-RU' } = req.query;

            console.log(`📊 Запрос трендовых фильмов: limit=${limit}, language=${language}`);

            // 1. Получаем ID трендовых фильмов из TMDB
            const trendingResult = await this.trendingTMDBService.getTrendingMovieIds(language);

            console.log(`Результат из TMDB: success=${trendingResult.success}, количество=${trendingResult.data?.results?.length || 0}`);

            if (!trendingResult.success) {
                // Если не удалось получить трендовые ID, используем популярные фильмы как fallback
                console.log('Используем fallback - популярные фильмы');
                const popularMovies = await this.moviesService.getPopularMovies(parseInt(limit));
                return res.status(200).json({
                    success: true,
                    data: popularMovies,
                    metadata: {
                        source: 'fallback_popular',
                        error: trendingResult.error,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // 2. Получаем TMDB ID фильмов
            const tmdbMovies = trendingResult.data.results.slice(0, parseInt(limit));
            const tmdbIds = tmdbMovies.map(movie => movie.id);

            console.log(`TMDB ID фильмов: ${tmdbIds.join(', ')}`);

            if (tmdbIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    metadata: {
                        message: 'Нет трендовых фильмов',
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // 3. Ищем фильмы в базе данных по tmdb_id
            const movies = [];
            const notFoundMovies = [];

            for (const tmdbMovie of tmdbMovies) {
                try {
                    // Ищем фильм в БД по tmdb_id
                    const [rows] = await this.moviesService.pool.execute(
                        'SELECT id FROM movies WHERE id = ? AND published = 1',
                        [tmdbMovie.id]
                    );

                    console.log(`Поиск фильма TMDB ID ${tmdbMovie.id}: ${rows.length > 0 ? 'найден' : 'не найден'}`);

                    if (rows.length > 0) {
                        // Получаем полную информацию о фильме через getMovieById
                        const movie = await this.moviesService.getMovieById(rows[0].id);
                        if (movie) {
                            // Добавляем метаданные из TMDB
                            movie.trending_metadata = {
                                rank: tmdbMovies.indexOf(tmdbMovie) + 1,
                                tmdb_popularity: tmdbMovie.popularity,
                                tmdb_vote_average: tmdbMovie.vote_average,
                                tmdb_vote_count: tmdbMovie.vote_count,
                                tmdb_poster_path: tmdbMovie.poster_path,
                                tmdb_backdrop_path: tmdbMovie.backdrop_path
                            };
                            movies.push(movie);
                            console.log(`✅ Добавлен фильм: ${movie.title} (ID в БД: ${movie.id})`);
                        } else {
                            notFoundMovies.push({
                                id: tmdbMovie.id,
                                title: tmdbMovie.title,
                                reason: 'Не удалось получить детали из базы'
                            });
                            console.log(`❌ Не удалось получить детали фильма: ${tmdbMovie.title}`);
                        }
                    } else {
                        notFoundMovies.push({
                            id: tmdbMovie.id,
                            title: tmdbMovie.title,
                            reason: 'Отсутствует в базе данных'
                        });
                        console.log(`⚠️ Фильм отсутствует в БД: ${tmdbMovie.title}`);
                    }
                } catch (dbError) {
                    console.error(`Ошибка при поиске фильма ${tmdbMovie.id}:`, dbError.message);
                    notFoundMovies.push({
                        id: tmdbMovie.id,
                        title: tmdbMovie.title,
                        reason: `Ошибка БД: ${dbError.message}`
                    });
                }
            }

            // 4. Возвращаем результат
            console.log(`📊 Результат: найдено ${movies.length} из ${tmdbMovies.length} фильмов`);

            return res.status(200).json({
                success: true,
                data: movies,
                metadata: {
                    total_trending: tmdbMovies.length,
                    found_in_db: movies.length,
                    missing_in_db: notFoundMovies.length,
                    missing_list: notFoundMovies,
                    source: 'database',
                    language,
                    proxyUsed: trendingResult.metadata.proxyUsed,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Ошибка в getTrendingMovies:', error);
            console.error('Stack trace:', error.stack);

            // Fallback на популярные фильмы
            try {
                const popularMovies = await this.moviesService.getPopularMovies(parseInt(req.query.limit || 20));
                return res.status(200).json({
                    success: true,
                    data: popularMovies,
                    metadata: {
                        source: 'fallback_popular',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (fallbackError) {
                console.error('❌ Ошибка fallback:', fallbackError);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка получения данных',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * Получить трендовые сериалы из базы данных
     * GET /api/series/trending
     */
    async getTrendingSeries(req, res) {
        try {
            const { limit = 20, language = 'ru-RU' } = req.query;

            console.log(`📊 Запрос трендовых сериалов: limit=${limit}, language=${language}`);

            // 1. Получаем ID трендовых сериалов из TMDB
            const trendingResult = await this.trendingTMDBService.getTrendingSeriesIds(language);

            console.log(`Результат из TMDB: success=${trendingResult.success}, количество=${trendingResult.data?.results?.length || 0}`);

            if (!trendingResult.success) {
                // Если не удалось получить трендовые ID, используем популярные сериалы как fallback
                console.log('Используем fallback - популярные сериалы');
                const popularSeries = await this.seriesService.getPopularSeries(parseInt(limit));
                return res.status(200).json({
                    success: true,
                    data: popularSeries,
                    metadata: {
                        source: 'fallback_popular',
                        error: trendingResult.error,
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // 2. Получаем TMDB ID сериалов
            const tmdbSeries = trendingResult.data.results.slice(0, parseInt(limit));
            const tmdbIds = tmdbSeries.map(series => series.id);

            console.log(`TMDB ID сериалов: ${tmdbIds.join(', ')}`);

            if (tmdbIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    metadata: {
                        message: 'Нет трендовых сериалов',
                        timestamp: new Date().toISOString()
                    }
                });
            }

            // 3. Ищем сериалы в базе данных по tmdb_id
            const series = [];
            const notFoundSeries = [];

            for (const tmdbSerie of tmdbSeries) {
                try {
                    // Ищем сериал в БД по tmdb_id
                    const [rows] = await this.seriesService.pool.execute(
                        'SELECT id FROM tv_series WHERE id = ? AND published = 1',
                        [tmdbSerie.id]
                    );

                    console.log(`Поиск сериала TMDB ID ${tmdbSerie.id}: ${rows.length > 0 ? 'найден' : 'не найден'}`);

                    if (rows.length > 0) {
                        // Получаем полную информацию о сериале через getSeriesById
                        const serie = await this.seriesService.getSeriesById(rows[0].id);
                        if (serie) {
                            // Добавляем метаданные из TMDB
                            serie.trending_metadata = {
                                rank: tmdbSeries.indexOf(tmdbSerie) + 1,
                                tmdb_popularity: tmdbSerie.popularity,
                                tmdb_vote_average: tmdbSerie.vote_average,
                                tmdb_vote_count: tmdbSerie.vote_count,
                                tmdb_poster_path: tmdbSerie.poster_path,
                                tmdb_backdrop_path: tmdbSerie.backdrop_path
                            };
                            series.push(serie);
                            console.log(`✅ Добавлен сериал: ${serie.name} (ID в БД: ${serie.id})`);
                        } else {
                            notFoundSeries.push({
                                id: tmdbSerie.id,
                                name: tmdbSerie.name,
                                reason: 'Не удалось получить детали из базы'
                            });
                            console.log(`❌ Не удалось получить детали сериала: ${tmdbSerie.name}`);
                        }
                    } else {
                        notFoundSeries.push({
                            id: tmdbSerie.id,
                            name: tmdbSerie.name,
                            reason: 'Отсутствует в базе данных'
                        });
                        console.log(`⚠️ Сериал отсутствует в БД: ${tmdbSerie.name}`);
                    }
                } catch (dbError) {
                    console.error(`Ошибка при поиске сериала ${tmdbSerie.id}:`, dbError.message);
                    notFoundSeries.push({
                        id: tmdbSerie.id,
                        name: tmdbSerie.name,
                        reason: `Ошибка БД: ${dbError.message}`
                    });
                }
            }

            // 4. Возвращаем результат
            console.log(`📊 Результат: найдено ${series.length} из ${tmdbSeries.length} сериалов`);

            return res.status(200).json({
                success: true,
                data: series,
                metadata: {
                    total_trending: tmdbSeries.length,
                    found_in_db: series.length,
                    missing_in_db: notFoundSeries.length,
                    missing_list: notFoundSeries,
                    source: 'database',
                    language,
                    proxyUsed: trendingResult.metadata.proxyUsed,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Ошибка в getTrendingSeries:', error);
            console.error('Stack trace:', error.stack);

            // Fallback на популярные сериалы
            try {
                const popularSeries = await this.seriesService.getPopularSeries(parseInt(req.query.limit || 20));
                return res.status(200).json({
                    success: true,
                    data: popularSeries,
                    metadata: {
                        source: 'fallback_popular',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (fallbackError) {
                console.error('❌ Ошибка fallback:', fallbackError);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка получения данных',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * Получить трендовые фильмы напрямую из TMDB (облегченная версия)
     * GET /api/movies/trending/tmdb
     */
    async getTrendingMoviesFromTMDB(req, res) {
        try {
            const { limit = 20, language = 'ru-RU' } = req.query;
            const result = await this.trendingTMDBService.getTrendingMoviesLight(parseInt(limit), language);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error,
                    proxyUsed: result.proxyUsed,
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(200).json({
                success: true,
                data: result.data,
                metadata: result.metadata,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Ошибка в getTrendingMoviesFromTMDB:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Получить трендовые сериалы напрямую из TMDB (облегченная версия)
     * GET /api/series/trending/tmdb
     */
    async getTrendingSeriesFromTMDB(req, res) {
        try {
            const { limit = 20, language = 'ru-RU' } = req.query;
            const result = await this.trendingTMDBService.getTrendingSeriesLight(parseInt(limit), language);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error,
                    proxyUsed: result.proxyUsed,
                    timestamp: new Date().toISOString()
                });
            }

            return res.status(200).json({
                success: true,
                data: result.data,
                metadata: result.metadata,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Ошибка в getTrendingSeriesFromTMDB:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Проверка статуса сервиса
     * GET /api/trending/health
     */
    async healthCheck(req, res) {
        try {
            const result = await this.trendingTMDBService.getTrendingMovieIds('ru-RU');

            return res.status(200).json({
                success: true,
                status: 'healthy',
                service: 'TrendingTMDBService',
                proxyEnabled: result.proxyUsed,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                status: 'unhealthy',
                service: 'TrendingTMDBService',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

const trendingController = new TrendingController();
export default trendingController;