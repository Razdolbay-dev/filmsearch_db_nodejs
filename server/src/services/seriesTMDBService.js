import config from '../config/index.js';
import proxyManager from '../models/ProxyManager.js';

/**
 * Сервис для работы с TMDB TV Series API
 */
class SeriesTMDBService {
    constructor() {
        this.baseUrl = config.tmdb.tvAPIUrl;
        this.token = config.tmdb.apiToken;
        this.requestDelay = 250; // Задержка между запросами в ms (для избежания rate limits)
        this.maxConcurrentRequests = 5; // Максимальное количество параллельных запросов
    }

    /**
     * Выполняет запросы с ограничением по количеству параллельных запросов
     */
    async executeWithConcurrencyLimit(tasks, limit = this.maxConcurrentRequests) {
        const results = [];
        const executing = [];

        for (const [index, task] of tasks.entries()) {
            const promise = task().then(result => {
                executing.splice(executing.indexOf(promise), 1);
                return { index, result };
            });

            executing.push(promise);
            results.push(promise);

            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }

        const allResults = await Promise.all(results);
        // Сортируем результаты по исходному порядку
        return allResults.sort((a, b) => a.index - b.index).map(item => item.result);
    }

    /**
     * Общий метод для выполнения запросов
     */
    async makeRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                ...options.headers
            },
            timeout: options.timeout || config.proxy.timeout || 30000,
            responseType: options.responseType || 'json',
            ...options.axiosConfig
        };

        try {
            if (config.proxy.enabled) {
                return await this.makeRequestWithProxy(url, defaultOptions);
            } else {
                return await this.makeRequestNative(url, defaultOptions);
            }
        } catch (error) {
            console.error(`❌ Ошибка запроса к ${url}:`, error.message);

            error.proxyUsed = config.proxy.enabled;

            if (options.retry && config.proxy.retryCount > 0) {
                return this.retryRequest(url, defaultOptions, config.proxy.retryCount);
            }

            throw error;
        }
    }

    /**
     * Выполняет запрос через прокси
     */
    async makeRequestWithProxy(url, options) {
        const proxyOptions = {
            responseType: 'stream',
            timeout: options.timeout,
            headers: {
                'User-Agent': config.tmdb.userAgent,
                'Accept': 'application/json, text/plain, */*',
                ...options.headers
            },
            ...options.axiosConfig
        };

        const response = await proxyManager.get(url, proxyOptions);

        if (options.responseType === 'json') {
            return await this.streamToJson(response.data);
        }

        return response;
    }

    /**
     * Выполняет запрос нативно
     */
    async makeRequestNative(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        try {
            const response = await fetch(url, {
                method: options.method,
                headers: options.headers,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (options.responseType === 'json') {
                return await response.json();
            }

            return response;

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Преобразует поток в JSON
     */
    async streamToJson(stream) {
        return new Promise((resolve, reject) => {
            let data = '';
            stream.on('data', chunk => data += chunk);
            stream.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Ошибка парсинга JSON: ${e.message}`));
                }
            });
            stream.on('error', reject);
        });
    }

    /**
     * Добавляет задержку между запросами
     */
    async delay(ms = this.requestDelay) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Повторная попытка выполнения запроса
     */
    async retryRequest(url, options, retriesLeft) {
        console.log(`🔄 Повторная попытка запроса. Осталось попыток: ${retriesLeft}`);

        const delay = Math.pow(2, config.proxy.retryCount - retriesLeft) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            if (config.proxy.enabled) {
                return await this.makeRequestWithProxy(url, options);
            } else {
                return await this.makeRequestNative(url, options);
            }
        } catch (error) {
            if (retriesLeft > 1) {
                return this.retryRequest(url, options, retriesLeft - 1);
            }
            throw error;
        }
    }

    // ==================== ОСНОВНЫЕ МЕТОДЫ ====================

    /**
     * Получить детали сериала
     */
    async getSeriesDetails(seriesId, language = 'ru-RU') {
        const url = `${this.baseUrl}/${seriesId}?language=${language}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    seriesId,
                    language,
                    proxyUsed: config.proxy.enabled,
                    numberOfSeasons: data.number_of_seasons || 0,
                    numberOfEpisodes: data.number_of_episodes || 0,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получить полную информацию о сериале (с актерами, сезонами, эпизодами и т.д.)
     * Без искусственных ограничений, но с защитой от rate limits
     */
    async getFullSeriesInfo(seriesId, language = 'ru-RU', options = {}) {
        const {
            includeSeasons = true, // Включать ли информацию о сезонах
            includeEpisodes = true, // Включать ли информацию об эпизодах
            includeFullEpisodes = false, // Включать полную информацию об эпизодах
            maxConcurrent = this.maxConcurrentRequests, // Максимальное количество параллельных запросов
            includeCredits = true, // Включать актерский состав
            includeRecommendations = true, // Включать рекомендации
            includeSimilar = false, // Включать похожие сериалы
            includeContentRatings = true, // Включать рейтинги
            includeVideos = false, // Включать видео (трейлеры)
            includeKeywords = false, // Включать ключевые слова
            includeReviews = false, // Включать обзоры
            includeWatchProviders = false // Включать информацию о стриминге
        } = options;

        try {
            console.log(`📺 Загрузка полной информации о сериале ID: ${seriesId}`);
            console.log(`🔧 Прокси ${config.proxy.enabled ? 'включен' : 'выключен'}`);
            console.log(`⚡ Параллельных запросов: ${maxConcurrent}`);

            const startTime = Date.now();

            // Основные запросы для сериала
            const basicRequests = [
                `${this.baseUrl}/${seriesId}?language=${language}`
            ];

            // Добавляем дополнительные запросы в зависимости от опций
            if (includeCredits) {
                basicRequests.push(`${this.baseUrl}/${seriesId}/credits?language=${language}`);
            }

            if (includeContentRatings) {
                basicRequests.push(`${this.baseUrl}/${seriesId}/content_ratings`);
            }

            if (includeRecommendations) {
                basicRequests.push(`${this.baseUrl}/${seriesId}/recommendations?language=${language}&page=1`);
            }

            if (includeSimilar) {
                basicRequests.push(`${this.baseUrl}/${seriesId}/similar?language=${language}&page=1`);
            }

            if (includeVideos) {
                basicRequests.push(`${this.baseUrl}/${seriesId}/videos?language=${language}`);
            }

            if (includeKeywords) {
                basicRequests.push(`${this.baseUrl}/${seriesId}/keywords`);
            }

            if (includeReviews) {
                basicRequests.push(`${this.baseUrl}/${seriesId}/reviews?language=${language}&page=1`);
            }

            if (includeWatchProviders) {
                basicRequests.push(`${this.baseUrl}/${seriesId}/watch/providers`);
            }

            // Выполняем основные запросы с ограничением параллелизма
            const basicPromises = basicRequests.map(url =>
                () => this.makeRequest(url, { retry: true })
            );

            const basicResults = await this.executeWithConcurrencyLimit(basicPromises, maxConcurrent);

            // Извлекаем результаты
            const seriesDetails = basicResults[0];
            let currentIndex = 1;

            const credits = includeCredits ? basicResults[currentIndex++] : null;
            const contentRatings = includeContentRatings ? basicResults[currentIndex++] : null;
            const recommendations = includeRecommendations ? basicResults[currentIndex++] : null;
            const similar = includeSimilar ? basicResults[currentIndex++] : null;
            const videos = includeVideos ? basicResults[currentIndex++] : null;
            const keywords = includeKeywords ? basicResults[currentIndex++] : null;
            const reviews = includeReviews ? basicResults[currentIndex++] : null;
            const watchProviders = includeWatchProviders ? basicResults[currentIndex++] : null;

            // Получаем информацию о сезонах и эпизодах если нужно
            let seasonsInfo = [];
            let totalEpisodesLoaded = 0;

            if (includeSeasons && seriesDetails.seasons && seriesDetails.seasons.length > 0) {
                // Получаем все сезоны (без ограничений)
                seasonsInfo = await this.getSeasonsWithEpisodes(
                    seriesId,
                    seriesDetails.seasons,
                    language,
                    includeEpisodes,
                    includeFullEpisodes,
                    maxConcurrent
                );

                // Считаем общее количество загруженных эпизодов
                totalEpisodesLoaded = seasonsInfo.reduce((total, season) =>
                    total + (season.episodes?.length || season.episodesPreview?.length || 0), 0
                );
            }

            const endTime = Date.now();
            const executionTime = endTime - startTime;

            // Формируем финальный ответ
            const result = {
                success: true,
                data: {
                    ...seriesDetails,
                    credits: credits || null,
                    content_ratings: contentRatings?.results || null,
                    recommendations: recommendations?.results || [],
                    similar: similar?.results || [],
                    videos: videos?.results || [],
                    keywords: keywords?.results || [],
                    reviews: reviews?.results || [],
                    watch_providers: watchProviders?.results || null,
                    seasons: seasonsInfo
                },
                metadata: {
                    seriesId,
                    language,
                    proxyUsed: config.proxy.enabled,
                    totalSeasons: seriesDetails.number_of_seasons || 0,
                    totalEpisodes: seriesDetails.number_of_episodes || 0,
                    seasonsLoaded: seasonsInfo.length,
                    episodesLoaded: totalEpisodesLoaded,
                    castCount: credits?.cast?.length || 0,
                    crewCount: credits?.crew?.length || 0,
                    recommendationsCount: recommendations?.results?.length || 0,
                    similarCount: similar?.results?.length || 0,
                    videosCount: videos?.results?.length || 0,
                    keywordsCount: keywords?.results?.length || 0,
                    reviewsCount: reviews?.results?.length || 0,
                    included: {
                        seasons: includeSeasons,
                        episodes: includeEpisodes,
                        fullEpisodes: includeFullEpisodes,
                        credits: includeCredits,
                        recommendations: includeRecommendations,
                        similar: includeSimilar,
                        contentRatings: includeContentRatings,
                        videos: includeVideos,
                        keywords: includeKeywords,
                        reviews: includeReviews,
                        watchProviders: includeWatchProviders
                    },
                    performance: {
                        executionTimeMs: executionTime,
                        totalRequests: basicRequests.length + (seasonsInfo.length * (includeEpisodes ? 2 : 1)),
                        maxConcurrentRequests: maxConcurrent,
                        requestDelay: this.requestDelay
                    },
                    timestamp: new Date().toISOString()
                }
            };

            console.log(`✅ Полная информация о сериале "${seriesDetails.name}" загружена`);
            console.log(`⏱️  Время выполнения: ${executionTime}ms`);
            console.log(`📊 Статистика: ${seasonsInfo.length} сезонов, ${totalEpisodesLoaded} эпизодов`);
            console.log(`📡 Запросов: ${result.metadata.performance.totalRequests}`);

            return result;

        } catch (error) {
            console.error(`❌ Ошибка загрузки полной информации о сериале ${seriesId}:`, error.message);

            return {
                success: false,
                error: error.message,
                seriesId,
                proxyUsed: config.proxy.enabled,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Получить детали сезона
     */
    async getSeasonDetails(seriesId, seasonNumber, language = 'ru-RU') {
        const url = `${this.baseUrl}/${seriesId}/season/${seasonNumber}?language=${language}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    seriesId,
                    seasonNumber,
                    language,
                    proxyUsed: config.proxy.enabled,
                    episodeCount: data.episodes?.length || 0,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                seasonNumber,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получить сезоны с эпизодами
     * Оптимизированная версия с защитой от rate limits
     */
    async getSeasonsWithEpisodes(seriesId, seasons, language, includeEpisodes = true, includeFullEpisodes = false, maxConcurrent = this.maxConcurrentRequests) {
        console.log(`🔍 Загрузка ${seasons.length} сезонов с ${includeEpisodes ? 'эпизодами' : 'без эпизодов'}`);

        // Фильтруем сезоны (исключаем спецвыпуски с season_number: 0)
        const regularSeasons = seasons.filter(s => s.season_number > 0);

        if (regularSeasons.length === 0) {
            return [];
        }

        // Создаем задачи для загрузки сезонов
        const seasonTasks = regularSeasons.map((season, index) => async () => {
            try {
                // Небольшая задержка между запросами для избежания rate limits
                if (index > 0) {
                    await this.delay();
                }

                const seasonResult = await this.getSeasonDetails(seriesId, season.season_number, language);

                if (!seasonResult.success) {
                    return {
                        ...season,
                        success: false,
                        error: seasonResult.error,
                        episodes: [],
                        episodes_count: 0,
                        episodes_loaded: 0
                    };
                }

                const seasonData = seasonResult.data;
                let episodes = [];
                let episodesPreview = [];

                // Если нужно включать эпизоды
                if (includeEpisodes && seasonData.episodes && seasonData.episodes.length > 0) {
                    // Создаем превью эпизодов
                    episodesPreview = seasonData.episodes.map(episode => ({
                        episode_number: episode.episode_number,
                        name: episode.name,
                        overview: episode.overview,
                        air_date: episode.air_date,
                        runtime: episode.runtime,
                        vote_average: episode.vote_average,
                        vote_count: episode.vote_count,
                        still_path: episode.still_path,
                        crew: episode.crew || [],
                        guest_stars: episode.guest_stars || []
                    }));

                    // Если нужно загружать полную информацию об эпизодах
                    if (includeFullEpisodes) {
                        console.log(`🎬 Загрузка полной информации для ${seasonData.episodes.length} эпизодов сезона ${season.season_number}`);

                        // Создаем задачи для загрузки эпизодов
                        const episodeTasks = seasonData.episodes.map((episode, epIndex) => async () => {
                            if (epIndex > 0) {
                                await this.delay(100); // Меньшая задержка для эпизодов
                            }

                            try {
                                const episodeResult = await this.getEpisodeDetails(
                                    seriesId,
                                    season.season_number,
                                    episode.episode_number,
                                    language
                                );

                                return episodeResult.success ? episodeResult.data : {
                                    ...episode,
                                    success: false,
                                    error: episodeResult.error
                                };
                            } catch (error) {
                                return {
                                    ...episode,
                                    success: false,
                                    error: error.message
                                };
                            }
                        });

                        // Выполняем задачи для эпизодов с ограничением параллелизма
                        episodes = await this.executeWithConcurrencyLimit(episodeTasks, maxConcurrent);
                    } else {
                        episodes = episodesPreview;
                    }
                }

                return {
                    ...seasonData,
                    success: true,
                    episodes: includeFullEpisodes ? episodes : undefined,
                    episodesPreview: !includeFullEpisodes ? episodesPreview : undefined,
                    episodes_count: seasonData.episodes?.length || 0,
                    episodes_loaded: episodes.length || episodesPreview.length,
                    has_full_episodes: includeFullEpisodes
                };

            } catch (error) {
                console.error(`❌ Ошибка загрузки сезона ${season.season_number}:`, error.message);

                return {
                    ...season,
                    success: false,
                    error: error.message,
                    episodes: [],
                    episodes_count: 0,
                    episodes_loaded: 0
                };
            }
        });

        // Выполняем задачи для сезонов с ограничением параллелизма
        const seasonsWithEpisodes = await this.executeWithConcurrencyLimit(seasonTasks, maxConcurrent);

        // Сортируем сезоны по номеру (от новых к старым)
        return seasonsWithEpisodes.sort((a, b) => b.season_number - a.season_number);
    }

    /**
     * Получить все сезоны с эпизодами (альтернативный метод)
     */
    async getAllSeasonsWithEpisodes(seriesId, language = 'ru-RU', includeFullEpisodes = false) {
        try {
            console.log(`📚 Загрузка всех сезонов с эпизодами для сериала ${seriesId}`);

            // Сначала получаем общую информацию о сериале
            const seriesResult = await this.getSeriesDetails(seriesId, language);

            if (!seriesResult.success) {
                return seriesResult;
            }

            const seriesData = seriesResult.data;

            if (!seriesData.seasons || seriesData.seasons.length === 0) {
                return {
                    success: true,
                    data: {
                        seriesInfo: seriesData,
                        seasons: []
                    },
                    metadata: {
                        seriesId,
                        language,
                        totalSeasons: 0,
                        seasonsLoaded: 0,
                        episodesLoaded: 0,
                        proxyUsed: config.proxy.enabled,
                        timestamp: new Date().toISOString()
                    }
                };
            }

            // Получаем все сезоны с эпизодами
            const seasonsInfo = await this.getSeasonsWithEpisodes(
                seriesId,
                seriesData.seasons,
                language,
                true, // includeEpisodes
                includeFullEpisodes
            );

            // Разделяем успешные и неуспешные сезоны
            const successfulSeasons = seasonsInfo.filter(s => s.success);
            const failedSeasons = seasonsInfo.filter(s => !s.success);

            // Считаем общее количество эпизодов
            const totalEpisodes = successfulSeasons.reduce((total, season) =>
                total + (season.episodes_count || 0), 0
            );

            const loadedEpisodes = successfulSeasons.reduce((total, season) =>
                total + (season.episodes_loaded || 0), 0
            );

            return {
                success: true,
                data: {
                    seriesInfo: seriesData,
                    seasons: successfulSeasons,
                    failedSeasons: failedSeasons.map(s => ({
                        season_number: s.season_number,
                        name: s.name,
                        error: s.error
                    }))
                },
                metadata: {
                    seriesId,
                    language,
                    totalSeasons: seriesData.seasons.length,
                    seasonsLoaded: successfulSeasons.length,
                    seasonsFailed: failedSeasons.length,
                    totalEpisodes,
                    episodesLoaded: loadedEpisodes,
                    hasFullEpisodes: includeFullEpisodes,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                proxyUsed: config.proxy.enabled,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Получить конкретный сезон с полной информацией об эпизодах
     */
    async getSeasonWithFullEpisodes(seriesId, seasonNumber, language = 'ru-RU') {
        try {
            console.log(`🎬 Загрузка сезона ${seasonNumber} с полной информацией об эпизодах`);

            // Получаем детали сезона
            const seasonResult = await this.getSeasonDetails(seriesId, seasonNumber, language);

            if (!seasonResult.success) {
                return seasonResult;
            }

            const seasonData = seasonResult.data;

            if (!seasonData.episodes || seasonData.episodes.length === 0) {
                return {
                    success: true,
                    data: {
                        ...seasonData,
                        episodes: []
                    },
                    metadata: {
                        seriesId,
                        seasonNumber,
                        language,
                        episodesLoaded: 0,
                        proxyUsed: config.proxy.enabled,
                        timestamp: new Date().toISOString()
                    }
                };
            }

            // Создаем задачи для загрузки полной информации об эпизодах
            const episodeTasks = seasonData.episodes.map((episode, index) => async () => {
                if (index > 0) {
                    await this.delay(100);
                }

                try {
                    const episodeResult = await this.getEpisodeDetails(
                        seriesId,
                        seasonNumber,
                        episode.episode_number,
                        language
                    );

                    return episodeResult.success ? episodeResult.data : {
                        ...episode,
                        success: false,
                        error: episodeResult.error
                    };
                } catch (error) {
                    return {
                        ...episode,
                        success: false,
                        error: error.message
                    };
                }
            });

            // Выполняем задачи с ограничением параллелизма
            const episodes = await this.executeWithConcurrencyLimit(episodeTasks, this.maxConcurrentRequests);

            // Разделяем успешные и неуспешные эпизоды
            const successfulEpisodes = episodes.filter(ep => ep.success !== false);
            const failedEpisodes = episodes.filter(ep => ep.success === false);

            return {
                success: true,
                data: {
                    ...seasonData,
                    episodes: successfulEpisodes,
                    failedEpisodes: failedEpisodes.map(ep => ({
                        episode_number: ep.episode_number,
                        name: ep.name,
                        error: ep.error
                    }))
                },
                metadata: {
                    seriesId,
                    seasonNumber,
                    language,
                    totalEpisodes: seasonData.episodes.length,
                    episodesLoaded: successfulEpisodes.length,
                    episodesFailed: failedEpisodes.length,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                seasonNumber,
                proxyUsed: config.proxy.enabled,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Получить детали эпизода
     */
    async getEpisodeDetails(seriesId, seasonNumber, episodeNumber, language = 'ru-RU') {
        const url = `${this.baseUrl}/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}?language=${language}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    seriesId,
                    seasonNumber,
                    episodeNumber,
                    language,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                seasonNumber,
                episodeNumber,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получить полный сезон с деталями всех эпизодов
     */
    async getFullSeason(seriesId, seasonNumber, language = 'ru-RU') {
        const urls = [
            `${this.baseUrl}/${seriesId}/season/${seasonNumber}?language=${language}`,
            `${this.baseUrl}/${seriesId}/season/${seasonNumber}/credits?language=${language}`
        ];

        try {
            console.log(`🎬 Загрузка сезона ${seasonNumber} сериала ${seriesId}`);

            const [seasonDetails, credits] = await Promise.all(
                urls.map(url => this.makeRequest(url, { retry: true }))
            );

            return {
                success: true,
                data: {
                    ...seasonDetails,
                    credits
                },
                metadata: {
                    seriesId,
                    seasonNumber,
                    language,
                    proxyUsed: config.proxy.enabled,
                    episodeCount: seasonDetails.episodes?.length || 0,
                    castCount: credits.cast?.length || 0,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                seasonNumber,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получить все сезоны сериала
     */
    async getAllSeasons(seriesId, language = 'ru-RU') {
        try {
            // Сначала получаем общую информацию о сериале
            const seriesInfo = await this.getSeriesDetails(seriesId, language);

            if (!seriesInfo.success) {
                return seriesInfo;
            }

            const totalSeasons = seriesInfo.data.number_of_seasons;

            if (!totalSeasons || totalSeasons === 0) {
                return {
                    success: true,
                    data: {
                        seriesInfo: seriesInfo.data,
                        seasons: []
                    },
                    metadata: {
                        seriesId,
                        language,
                        totalSeasons: 0,
                        proxyUsed: config.proxy.enabled,
                        timestamp: new Date().toISOString()
                    }
                };
            }

            // Создаем запросы для каждого сезона
            const seasonRequests = [];
            for (let i = 1; i <= totalSeasons; i++) {
                seasonRequests.push(
                    this.getSeasonDetails(seriesId, i, language)
                );
            }

            // Выполняем все запросы
            const seasonsResults = await Promise.all(seasonRequests);

            const successfulSeasons = seasonsResults.filter(r => r.success);
            const failedSeasons = seasonsResults.filter(r => !r.success);

            return {
                success: true,
                data: {
                    seriesInfo: seriesInfo.data,
                    seasons: successfulSeasons.map(r => r.data),
                    failedSeasons: failedSeasons.map(r => ({
                        season: r.seasonNumber,
                        error: r.error
                    }))
                },
                metadata: {
                    seriesId,
                    language,
                    totalSeasons,
                    loadedSeasons: successfulSeasons.length,
                    failedSeasons: failedSeasons.length,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получить все эпизоды определенного сезона
     */
    async getAllEpisodes(seriesId, seasonNumber, language = 'ru-RU') {
        try {
            // Получаем детали сезона
            const seasonResult = await this.getSeasonDetails(seriesId, seasonNumber, language);

            if (!seasonResult.success) {
                return seasonResult;
            }

            const episodes = seasonResult.data.episodes || [];

            if (episodes.length === 0) {
                return {
                    success: true,
                    data: {
                        seasonInfo: seasonResult.data,
                        episodes: []
                    },
                    metadata: {
                        seriesId,
                        seasonNumber,
                        language,
                        totalEpisodes: 0,
                        proxyUsed: config.proxy.enabled,
                        timestamp: new Date().toISOString()
                    }
                };
            }

            // Получаем детали для каждого эпизода
            const episodeRequests = episodes.map(episode =>
                this.getEpisodeDetails(seriesId, seasonNumber, episode.episode_number, language)
            );

            const episodesResults = await Promise.all(episodeRequests);

            const successfulEpisodes = episodesResults.filter(r => r.success);
            const failedEpisodes = episodesResults.filter(r => !r.success);

            return {
                success: true,
                data: {
                    seasonInfo: seasonResult.data,
                    episodes: successfulEpisodes.map(r => r.data),
                    failedEpisodes: failedEpisodes.map(r => ({
                        episode: r.episodeNumber,
                        error: r.error
                    }))
                },
                metadata: {
                    seriesId,
                    seasonNumber,
                    language,
                    totalEpisodes: episodes.length,
                    loadedEpisodes: successfulEpisodes.length,
                    failedEpisodes: failedEpisodes.length,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                seasonNumber,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Поиск сериалов
     */
    async searchSeries(query, language = 'ru-RU', page = 1) {
        const url = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&language=${language}&page=${page}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    query,
                    language,
                    page,
                    totalResults: data.total_results,
                    totalPages: data.total_pages,
                    resultsCount: data.results?.length || 0,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                query,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Популярные сериалы
     */
    async getPopularSeries(language = 'ru-RU', page = 1) {
        const url = `https://api.themoviedb.org/3/tv/popular?language=${language}&page=${page}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    language,
                    page,
                    totalResults: data.total_results,
                    totalPages: data.total_pages,
                    resultsCount: data.results?.length || 0,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Сериалы в эфире
     */
    async getOnTheAirSeries(language = 'ru-RU', page = 1) {
        const url = `https://api.themoviedb.org/3/tv/on_the_air?language=${language}&page=${page}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    language,
                    page,
                    totalResults: data.total_results,
                    totalPages: data.total_pages,
                    resultsCount: data.results?.length || 0,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получить актерский состав сериала
     */
    async getSeriesCredits(seriesId, language = 'ru-RU') {
        const url = `${this.baseUrl}/${seriesId}/credits?language=${language}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    seriesId,
                    language,
                    proxyUsed: config.proxy.enabled,
                    castCount: data.cast?.length || 0,
                    crewCount: data.crew?.length || 0,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Получить похожие сериалы
     */
    async getSimilarSeries(seriesId, language = 'ru-RU', page = 1) {
        const url = `${this.baseUrl}/${seriesId}/similar?language=${language}&page=${page}`;

        try {
            const data = await this.makeRequest(url, { retry: true });

            return {
                success: true,
                data,
                metadata: {
                    seriesId,
                    language,
                    page,
                    totalResults: data.total_results,
                    totalPages: data.total_pages,
                    resultsCount: data.results?.length || 0,
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                seriesId,
                proxyUsed: config.proxy.enabled
            };
        }
    }

    /**
     * Проверить соединение с TV API
     */
    async testConnection() {
        const testUrl = `${this.baseUrl}/1399?language=ru-RU`; // Game of Thrones

        try {
            const startTime = Date.now();
            const data = await this.makeRequest(testUrl, {
                timeout: 10000
            });
            const endTime = Date.now();

            return {
                success: true,
                data: {
                    apiStatus: 'online',
                    responseTime: endTime - startTime,
                    testSeries: data.name
                },
                metadata: {
                    proxyUsed: config.proxy.enabled,
                    responseTimeMs: endTime - startTime,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: {
                    apiStatus: 'offline'
                },
                metadata: {
                    proxyUsed: config.proxy.enabled,
                    timestamp: new Date().toISOString()
                }
            };
        }
    }
}

// Экспортируем синглтон
const seriesService = new SeriesTMDBService();
export default seriesService;