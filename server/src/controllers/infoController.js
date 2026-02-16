import config from '../config/index.js';

/**
 * Контроллер для отображения информации о доступных API endpoint
 */
class InfoController {
    constructor() {
        // Привязываем методы к контексту класса
        this.getApiInfo = this.getApiInfo.bind(this);
        this.getServiceInfo = this.getServiceInfo.bind(this);
    }

    /**
     * Считает общее количество endpoint
     */
    countEndpoints(endpoints) {
        let count = 0;

        // Считаем основные endpoint
        count += endpoints.health ? 1 : 0;

        // Считаем movie endpoints
        if (endpoints.movies && endpoints.movies.endpoints) {
            count += endpoints.movies.endpoints.length;
        }

        // Считаем series endpoints
        if (endpoints.series && endpoints.series.endpoints) {
            count += endpoints.series.endpoints.length;
        }

        return count;
    }

    /**
     * Получить информацию обо всех доступных endpoint
     */
    async getApiInfo(req, res) {
        try {
            const baseUrl = `http://${config.app.host}:${config.app.port}`;
            const currentTimestamp = new Date().toISOString();

            const endpointsData = {
                health: {
                    path: '/health',
                    method: 'GET',
                    description: 'Проверка работоспособности сервиса',
                    example: `${baseUrl}/health`,
                    response_example: {
                        status: 'OK',
                        timestamp: '2023-10-01T12:00:00.000Z',
                        service: 'TMDB API Proxy',
                        version: '1.0.0',
                        environment: 'development'
                    }
                },

                movies: {
                    base_path: '/api/movies',
                    endpoints: [
                        {
                            path: '/api/movies/status',
                            method: 'GET',
                            description: 'Проверка статуса TMDB Movie API',
                            example: `${baseUrl}/api/movies/status`,
                            response_example: {
                                success: true,
                                data: {
                                    apiStatus: 'online',
                                    responseTime: 245,
                                    testMovie: 'Бойцовский клуб'
                                },
                                metadata: {
                                    proxyUsed: true,
                                    responseTimeMs: 245,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/movies/:id',
                            method: 'GET',
                            description: 'Получить детали фильма по ID',
                            parameters: {
                                id: 'ID фильма (например: 550)',
                                language: 'Язык (по умолчанию: ru-RU)'
                            },
                            example: `${baseUrl}/api/movies/550?language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    id: 550,
                                    title: 'Бойцовский клуб',
                                    overview: 'Сотрудник страховой компании страдает хронической бессонницей...',
                                    release_date: '1999-10-15',
                                    runtime: 139,
                                    vote_average: 8.4
                                },
                                metadata: {
                                    movieId: 550,
                                    language: 'ru-RU',
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/movies/:id/full',
                            method: 'GET',
                            description: 'Получить полную информацию о фильме с актерским составом',
                            parameters: {
                                id: 'ID фильма',
                                language: 'Язык (по умолчанию: ru-RU)'
                            },
                            example: `${baseUrl}/api/movies/550/full?language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    title: 'Бойцовский клуб',
                                    credits: {
                                        cast: [
                                            {
                                                name: 'Брэд Питт',
                                                character: 'Тайлер Дёрден'
                                            },
                                            {
                                                name: 'Эдвард Нортон',
                                                character: 'Рассказчик'
                                            }
                                        ]
                                    }
                                },
                                metadata: {
                                    movieId: 550,
                                    language: 'ru-RU',
                                    proxyUsed: true,
                                    castCount: 56,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/movies/:id/credits',
                            method: 'GET',
                            description: 'Получить актерский состав фильма',
                            parameters: {
                                id: 'ID фильма',
                                language: 'Язык (по умолчанию: ru-RU)'
                            },
                            example: `${baseUrl}/api/movies/550/credits?language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    id: 550,
                                    cast: [
                                        {
                                            cast_id: 4,
                                            character: 'Тайлер Дёрден',
                                            name: 'Брэд Питт',
                                            profile_path: '/kc3M04QQAuZ9woUvH3Ju5T7ZqG5.jpg'
                                        }
                                    ],
                                    crew: [
                                        {
                                            job: 'Director',
                                            name: 'Дэвид Финчер',
                                            department: 'Directing'
                                        }
                                    ]
                                },
                                metadata: {
                                    movieId: 550,
                                    language: 'ru-RU',
                                    proxyUsed: true,
                                    castCount: 56,
                                    crewCount: 124,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/movies/search',
                            method: 'GET',
                            description: 'Поиск фильмов по названию',
                            parameters: {
                                query: 'Поисковый запрос (обязательно)',
                                language: 'Язык (по умолчанию: ru-RU)',
                                page: 'Номер страницы (по умолчанию: 1)'
                            },
                            example: `${baseUrl}/api/movies/search?query=матрица&language=ru-RU&page=1`,
                            response_example: {
                                success: true,
                                data: {
                                    page: 1,
                                    results: [
                                        {
                                            id: 603,
                                            title: 'Матрица',
                                            overview: 'Мир Матрицы — это иллюзия...',
                                            release_date: '1999-03-30',
                                            vote_average: 8.2
                                        }
                                    ],
                                    total_pages: 1,
                                    total_results: 1
                                },
                                metadata: {
                                    query: 'матрица',
                                    language: 'ru-RU',
                                    page: 1,
                                    totalResults: 1,
                                    totalPages: 1,
                                    resultsCount: 1,
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/movies/batch/multiple',
                            method: 'GET',
                            description: 'Получить несколько фильмов одновременно',
                            parameters: {
                                ids: 'ID фильмов через запятую (обязательно)',
                                language: 'Язык (по умолчанию: ru-RU)'
                            },
                            example: `${baseUrl}/api/movies/batch/multiple?ids=550,680,155&language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    movies: [
                                        { id: 550, title: 'Бойцовский клуб' },
                                        { id: 680, title: 'Побег из Шоушенка' },
                                        { id: 155, title: 'Темный рыцарь' }
                                    ],
                                    failed: []
                                },
                                metadata: {
                                    total: 3,
                                    successCount: 3,
                                    failCount: 0,
                                    language: 'ru-RU',
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/movies/proxy-info',
                            method: 'GET',
                            description: 'Получить информацию о текущем прокси',
                            example: `${baseUrl}/api/movies/proxy-info`,
                            response_example: {
                                success: true,
                                data: {
                                    proxyEnabled: true,
                                    proxyInfo: {
                                        url: 'socks5://127.0.0.1:20170',
                                        type: 'socks5',
                                        host: '127.0.0.1',
                                        port: 20170,
                                        auth: false
                                    },
                                    config: {
                                        type: 'socks5',
                                        host: '127.0.0.1',
                                        port: 20170,
                                        timeout: 30000,
                                        retryCount: 3
                                    }
                                },
                                timestamp: '2023-10-01T12:00:00.000Z'
                            }
                        }
                    ]
                },

                series: {
                    base_path: '/api/series',
                    endpoints: [
                        {
                            path: '/api/series/status',
                            method: 'GET',
                            description: 'Проверка статуса TMDB TV Series API',
                            example: `${baseUrl}/api/series/status`,
                            response_example: {
                                success: true,
                                data: {
                                    apiStatus: 'online',
                                    responseTime: 320,
                                    testSeries: 'Игра престолов'
                                },
                                metadata: {
                                    proxyUsed: true,
                                    responseTimeMs: 320,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id',
                            method: 'GET',
                            description: 'Получить детали сериала по ID',
                            parameters: {
                                id: 'ID сериала (например: 1399)',
                                language: 'Язык (по умолчанию: ru-RU)'
                            },
                            example: `${baseUrl}/api/series/1399?language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    id: 1399,
                                    name: 'Игра престолов',
                                    overview: 'К концу лета...',
                                    number_of_seasons: 8,
                                    number_of_episodes: 73,
                                    first_air_date: '2011-04-17'
                                },
                                metadata: {
                                    seriesId: 1399,
                                    language: 'ru-RU',
                                    proxyUsed: true,
                                    numberOfSeasons: 8,
                                    numberOfEpisodes: 73,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id/full',
                            method: 'GET',
                            description: 'Полная информация о сериале с расширенными опциями',
                            parameters: {
                                id: 'ID сериала',
                                language: 'Язык (по умолчанию: ru-RU)',
                                includeSeasons: 'Включать сезоны (true/false, по умолчанию true)',
                                includeEpisodes: 'Включать эпизоды (true/false, по умолчанию true)',
                                includeFullEpisodes: 'Полная информация об эпизодах (true/false, по умолчанию false)',
                                maxConcurrent: 'Максимальное количество параллельных запросов (1-20, по умолчанию 5)',
                                includeCredits: 'Включать актерский состав (по умолчанию true)',
                                includeRecommendations: 'Включать рекомендации (по умолчанию true)',
                                includeSimilar: 'Включать похожие сериалы (по умолчанию false)',
                                includeContentRatings: 'Включать рейтинги (по умолчанию true)',
                                includeVideos: 'Включать видео (по умолчанию false)',
                                includeKeywords: 'Включать ключевые слова (по умолчанию false)',
                                includeReviews: 'Включать обзоры (по умолчанию false)',
                                includeWatchProviders: 'Включать информацию о стриминге (по умолчанию false)'
                            },
                            example: `${baseUrl}/api/series/1399/full?language=ru-RU&includeFullEpisodes=true&maxConcurrent=10`,
                            response_example: {
                                success: true,
                                data: {
                                    name: 'Игра престолов',
                                    overview: '...',
                                    seasons: [
                                        {
                                            season_number: 8,
                                            name: 'Сезон 8',
                                            episodes: [
                                                {
                                                    episode_number: 1,
                                                    name: 'Винтерфелл',
                                                    overview: 'Джон и Дейенерис прибывают в Винтерфелл...',
                                                    runtime: 54
                                                }
                                            ]
                                        }
                                    ]
                                },
                                metadata: {
                                    seriesId: 1399,
                                    language: 'ru-RU',
                                    proxyUsed: true,
                                    totalSeasons: 8,
                                    totalEpisodes: 73,
                                    seasonsLoaded: 5,
                                    episodesLoaded: 25,
                                    castCount: 154,
                                    performance: {
                                        executionTimeMs: 4500,
                                        totalRequests: 35,
                                        maxConcurrentRequests: 10
                                    },
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id/seasons-with-episodes',
                            method: 'GET',
                            description: 'Получить все сезоны с эпизодами',
                            parameters: {
                                id: 'ID сериала',
                                language: 'Язык (по умолчанию: ru-RU)',
                                includeFullEpisodes: 'Полная информация об эпизодах (true/false, по умолчанию false)'
                            },
                            example: `${baseUrl}/api/series/1399/seasons-with-episodes?language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    seriesInfo: {
                                        name: 'Игра престолов',
                                        number_of_seasons: 8
                                    },
                                    seasons: [
                                        {
                                            season_number: 8,
                                            name: 'Сезон 8',
                                            episodes_count: 6,
                                            episodes_loaded: 6
                                        }
                                    ]
                                },
                                metadata: {
                                    seriesId: 1399,
                                    language: 'ru-RU',
                                    totalSeasons: 8,
                                    seasonsLoaded: 8,
                                    totalEpisodes: 73,
                                    episodesLoaded: 73,
                                    hasFullEpisodes: false,
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id/season/:seasonNumber/full-episodes',
                            method: 'GET',
                            description: 'Получить сезон с полной информацией об эпизодах',
                            parameters: {
                                id: 'ID сериала',
                                seasonNumber: 'Номер сезона',
                                language: 'Язык (по умолчанию: ru-RU)'
                            },
                            example: `${baseUrl}/api/series/1399/season/8/full-episodes?language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    season_number: 8,
                                    name: 'Сезон 8',
                                    episodes: [
                                        {
                                            episode_number: 1,
                                            name: 'Винтерфелл',
                                            overview: 'Джон и Дейенерис прибывают в Винтерфелл...',
                                            crew: [
                                                {
                                                    job: 'Director',
                                                    name: 'Дэвид Наттер'
                                                }
                                            ],
                                            guest_stars: [
                                                {
                                                    name: 'Питер Динклэйдж',
                                                    character: 'Тирион Ланистер'
                                                }
                                            ]
                                        }
                                    ]
                                },
                                metadata: {
                                    seriesId: 1399,
                                    seasonNumber: 8,
                                    language: 'ru-RU',
                                    totalEpisodes: 6,
                                    episodesLoaded: 6,
                                    episodesFailed: 0,
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id/season/:seasonNumber',
                            method: 'GET',
                            description: 'Получить детали сезона',
                            parameters: {
                                id: 'ID сериала',
                                seasonNumber: 'Номер сезона',
                                language: 'Язык (по умолчанию: ru-RU)'
                            },
                            example: `${baseUrl}/api/series/1399/season/1?language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    id: 3624,
                                    name: 'Сезон 1',
                                    overview: 'Первый сезон...',
                                    season_number: 1,
                                    episode_count: 10,
                                    episodes: [
                                        {
                                            episode_number: 1,
                                            name: 'Зима близко',
                                            overview: '...'
                                        }
                                    ]
                                },
                                metadata: {
                                    seriesId: 1399,
                                    seasonNumber: 1,
                                    language: 'ru-RU',
                                    proxyUsed: true,
                                    episodeCount: 10,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id/season/:seasonNumber/episode/:episodeNumber',
                            method: 'GET',
                            description: 'Получить детали эпизода',
                            parameters: {
                                id: 'ID сериала',
                                seasonNumber: 'Номер сезона',
                                episodeNumber: 'Номер эпизода',
                                language: 'Язык (по умолчанию: ru-RU)'
                            },
                            example: `${baseUrl}/api/series/1399/season/1/episode/1?language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    episode_number: 1,
                                    name: 'Зима близко',
                                    overview: 'В Семи Королевствах...',
                                    runtime: 62,
                                    vote_average: 8.3,
                                    crew: [
                                        {
                                            job: 'Director',
                                            name: 'Тим Ван Паттен'
                                        }
                                    ]
                                },
                                metadata: {
                                    seriesId: 1399,
                                    seasonNumber: 1,
                                    episodeNumber: 1,
                                    language: 'ru-RU',
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id/credits',
                            method: 'GET',
                            description: 'Получить актерский состав сериала',
                            parameters: {
                                id: 'ID сериала',
                                language: 'Язык (по умолчанию: ru-RU)'
                            },
                            example: `${baseUrl}/api/series/1399/credits?language=ru-RU`,
                            response_example: {
                                success: true,
                                data: {
                                    id: 1399,
                                    cast: [
                                        {
                                            character: 'Джон Сноу',
                                            name: 'Кит Харингтон'
                                        },
                                        {
                                            character: 'Дейенерис Таргариен',
                                            name: 'Эмилия Кларк'
                                        }
                                    ]
                                },
                                metadata: {
                                    seriesId: 1399,
                                    language: 'ru-RU',
                                    proxyUsed: true,
                                    castCount: 154,
                                    crewCount: 234,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id/similar',
                            method: 'GET',
                            description: 'Получить похожие сериалы',
                            parameters: {
                                id: 'ID сериала',
                                language: 'Язык (по умолчанию: ru-RU)',
                                page: 'Номер страницы (по умолчанию: 1)'
                            },
                            example: `${baseUrl}/api/series/1399/similar?language=ru-RU&page=1`,
                            response_example: {
                                success: true,
                                data: {
                                    page: 1,
                                    results: [
                                        {
                                            id: 75006,
                                            name: 'Ведьмак',
                                            overview: '...'
                                        }
                                    ],
                                    total_pages: 3,
                                    total_results: 45
                                },
                                metadata: {
                                    seriesId: 1399,
                                    language: 'ru-RU',
                                    page: 1,
                                    totalResults: 45,
                                    totalPages: 3,
                                    resultsCount: 20,
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/search',
                            method: 'GET',
                            description: 'Поиск сериалов по названию',
                            parameters: {
                                query: 'Поисковый запрос (обязательно)',
                                language: 'Язык (по умолчанию: ru-RU)',
                                page: 'Номер страницы (по умолчанию: 1)'
                            },
                            example: `${baseUrl}/api/series/search?query=во+все&language=ru-RU&page=1`,
                            response_example: {
                                success: true,
                                data: {
                                    page: 1,
                                    results: [
                                        {
                                            id: 48866,
                                            name: 'Во все тяжкие',
                                            overview: 'Уолтер Уайт...',
                                            first_air_date: '2008-01-20'
                                        }
                                    ],
                                    total_pages: 1,
                                    total_results: 1
                                },
                                metadata: {
                                    query: 'во все',
                                    language: 'ru-RU',
                                    page: 1,
                                    totalResults: 1,
                                    totalPages: 1,
                                    resultsCount: 1,
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/popular',
                            method: 'GET',
                            description: 'Популярные сериалы',
                            parameters: {
                                language: 'Язык (по умолчанию: ru-RU)',
                                page: 'Номер страницы (по умолчанию: 1)'
                            },
                            example: `${baseUrl}/api/series/popular?language=ru-RU&page=1`,
                            response_example: {
                                success: true,
                                data: {
                                    page: 1,
                                    results: [
                                        {
                                            id: 1399,
                                            name: 'Игра престолов',
                                            overview: '...'
                                        },
                                        {
                                            id: 66732,
                                            name: 'Стрейнджерс',
                                            overview: '...'
                                        }
                                    ],
                                    total_pages: 500,
                                    total_results: 10000
                                },
                                metadata: {
                                    language: 'ru-RU',
                                    page: 1,
                                    totalResults: 10000,
                                    totalPages: 500,
                                    resultsCount: 20,
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/on-the-air',
                            method: 'GET',
                            description: 'Сериалы в эфире',
                            parameters: {
                                language: 'Язык (по умолчанию: ru-RU)',
                                page: 'Номер страницы (по умолчанию: 1)'
                            },
                            example: `${baseUrl}/api/series/on-the-air?language=ru-RU&page=1`,
                            response_example: {
                                success: true,
                                data: {
                                    page: 1,
                                    results: [
                                        {
                                            id: 94605,
                                            name: 'Одни из нас',
                                            overview: '...'
                                        }
                                    ],
                                    total_pages: 50,
                                    total_results: 1000
                                },
                                metadata: {
                                    language: 'ru-RU',
                                    page: 1,
                                    totalResults: 1000,
                                    totalPages: 50,
                                    resultsCount: 20,
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id/seasons/paginated',
                            method: 'GET',
                            description: 'Получить сезоны с пагинацией',
                            parameters: {
                                id: 'ID сериала',
                                language: 'Язык (по умолчанию: ru-RU)',
                                page: 'Номер страницы (по умолчанию: 1)',
                                limit: 'Количество на странице (по умолчанию: 10, максимум 50)'
                            },
                            example: `${baseUrl}/api/series/1399/seasons/paginated?page=1&limit=5`,
                            response_example: {
                                success: true,
                                data: {
                                    seasons: [
                                        { season_number: 8, name: 'Сезон 8' },
                                        { season_number: 7, name: 'Сезон 7' }
                                    ],
                                    pagination: {
                                        page: 1,
                                        limit: 5,
                                        total: 8,
                                        totalPages: 2,
                                        hasNext: true,
                                        hasPrev: false,
                                        currentCount: 5
                                    }
                                },
                                metadata: {
                                    seriesId: 1399,
                                    language: 'ru-RU',
                                    totalSeasons: 8,
                                    loadedSeasons: 5,
                                    failedSeasons: 0,
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        },
                        {
                            path: '/api/series/:id/season/:seasonNumber/episodes/paginated',
                            method: 'GET',
                            description: 'Получить эпизоды с пагинацией',
                            parameters: {
                                id: 'ID сериала',
                                seasonNumber: 'Номер сезона',
                                language: 'Язык (по умолчанию: ru-RU)',
                                page: 'Номер страницы (по умолчанию: 1)',
                                limit: 'Количество на странице (по умолчанию: 20, максимум 100)'
                            },
                            example: `${baseUrl}/api/series/1399/season/1/episodes/paginated?page=1&limit=10`,
                            response_example: {
                                success: true,
                                data: {
                                    season_info: {
                                        name: 'Сезон 1',
                                        season_number: 1
                                    },
                                    episodes: [
                                        { episode_number: 1, name: 'Зима близко' },
                                        { episode_number: 2, name: 'Королевский тракт' }
                                    ],
                                    pagination: {
                                        page: 1,
                                        limit: 10,
                                        total: 10,
                                        totalPages: 1,
                                        hasNext: false,
                                        hasPrev: false,
                                        currentCount: 10
                                    }
                                },
                                metadata: {
                                    seriesId: 1399,
                                    seasonNumber: 1,
                                    language: 'ru-RU',
                                    totalEpisodes: 10,
                                    loadedEpisodes: 10,
                                    failedEpisodes: 0,
                                    proxyUsed: true,
                                    timestamp: '2023-10-01T12:00:00.000Z'
                                }
                            }
                        }
                    ]
                }
            };

            const totalEndpoints = this.countEndpoints(endpointsData);

            const info = {
                success: true,
                data: {
                    service: 'TMDB API Proxy Service',
                    version: '1.0.0',
                    documentation: 'Auto-generated API documentation',
                    timestamp: currentTimestamp,
                    environment: config.app.env,
                    proxy_enabled: config.proxy.enabled,
                    base_url: baseUrl,

                    endpoints: endpointsData,

                    examples: {
                        quick_start: [
                            `curl "${baseUrl}/health"`,
                            `curl "${baseUrl}/api/movies/550"`,
                            `curl "${baseUrl}/api/series/1399"`,
                            `curl "${baseUrl}/api/movies/search?query=матрица"`,
                            `curl "${baseUrl}/api/series/search?query=во+все"`
                        ],
                        popular_content: [
                            `Фильм "Бойцовский клуб": ${baseUrl}/api/movies/550`,
                            `Фильм "Побег из Шоушенка": ${baseUrl}/api/movies/680`,
                            `Фильм "Темный рыцарь": ${baseUrl}/api/movies/155`,
                            `Сериал "Игра престолов": ${baseUrl}/api/series/1399`,
                            `Сериал "Во все тяжкие": ${baseUrl}/api/series/1396`,
                            `Сериал "Друзья": ${baseUrl}/api/series/1668`
                        ],
                        batch_operations: [
                            `Несколько фильмов: ${baseUrl}/api/movies/batch/multiple?ids=550,680,155`,
                            `Полная информация о сериале: ${baseUrl}/api/series/1399/full`,
                            `Все сезоны с эпизодами: ${baseUrl}/api/series/1399/seasons-with-episodes`
                        ]
                    },

                    rate_limits: {
                        tmdb_api: '40 запросов в 10 секунд',
                        proxy_service: 'Без ограничений (за исключением TMDB limits)',
                        recommendations: [
                            'Используйте параметр maxConcurrent для контроля параллельных запросов',
                            'Для больших запросов используйте пагинацию',
                            'Кэшируйте результаты на стороне клиента'
                        ]
                    },

                    proxy_configuration: {
                        enabled: config.proxy.enabled,
                        type: config.proxy.type,
                        host: config.proxy.host,
                        port: config.proxy.port,
                        timeout: config.proxy.timeout,
                        retry_count: config.proxy.retryCount
                    }
                },
                metadata: {
                    generated_at: currentTimestamp,
                    total_endpoints: totalEndpoints,
                    service_status: 'operational'
                }
            };

            res.json(info);

        } catch (error) {
            console.error('❌ Ошибка в контроллере getApiInfo:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Получить краткую информацию о сервисе
     */
    async getServiceInfo(req, res) {
        try {
            const info = {
                success: true,
                data: {
                    service: 'TMDB API Proxy Service',
                    version: '1.0.0',
                    description: 'Прокси-сервис для работы с The Movie Database API',
                    features: [
                        'Полная поддержка TMDB Movies API',
                        'Полная поддержка TMDB TV Series API',
                        'Автоматическое переключение между прокси и нативными запросами',
                        'Обработка ошибок и повторные попытки',
                        'Параллельная загрузка данных',
                        'Пагинация и фильтрация',
                        'Подробные метаданные в ответах',
                        'Защита от rate limits TMDB API'
                    ],
                    statistics: {
                        total_movie_endpoints: 7,
                        total_series_endpoints: 15,
                        total_endpoints: 23,
                        supports_languages: ['ru-RU', 'en-US', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'ja-JP', 'ko-KR', 'zh-CN'],
                        proxy_support: true,
                        cache_support: true,
                        rate_limit_protection: true
                    },
                    quick_links: {
                        health: '/health',
                        api_docs: '/api/info',
                        movies_base: '/api/movies',
                        series_base: '/api/series',
                        example_movie: '/api/movies/550',
                        example_series: '/api/series/1399'
                    },
                    timestamp: new Date().toISOString()
                }
            };

            res.json(info);

        } catch (error) {
            console.error('❌ Ошибка в контроллере getServiceInfo:', error);

            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера',
                message: error.message
            });
        }
    }
}

// Экспортируем экземпляр контроллера
const infoController = new InfoController();
export default infoController;