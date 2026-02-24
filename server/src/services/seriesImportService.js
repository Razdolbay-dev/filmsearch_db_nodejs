import { pool } from "../config/database.js";
import axios from 'axios';

// URL API
const API_BASE_URL = 'http://127.0.0.1:5000/api/tmdb_series';

export class SeriesImportService {
    constructor() {
        this.connection = null;
    }

    async connect() {
        if (!this.connection) {
            this.connection = await pool.getConnection();
        }
        return this.connection;
    }

    async disconnect() {
        if (this.connection) {
            this.connection.release();
            this.connection = null;
        }
    }

    async beginTransaction() {
        const conn = await this.connect();
        await conn.beginTransaction();
    }

    async commit() {
        const conn = await this.connect();
        await conn.commit();
    }

    async rollback() {
        const conn = await this.connect();
        await conn.rollback();
    }

    /**
     * Основной метод импорта сериала по ID
     */
    async importSeriesById(seriesId) {
        try {
            await this.beginTransaction();

            // Получаем данные из API с эпизодами
            const seriesData = await this.fetchSeriesDataWithEpisodes(seriesId);

            if (!seriesData.success || !seriesData.data) {
                throw new Error(`Не удалось получить данные для сериала ID: ${seriesId}`);
            }

            const data = seriesData.data;
            const seriesInfo = data.seriesInfo;
            const seasonsData = data.seasons;
            const metadata = seriesData.metadata;

            // Проверяем, существует ли уже сериал
            const exists = await this.checkSeriesExists(seriesId);

            if (exists) {
                console.log(`Сериал ID: ${seriesId} уже существует, обновляем...`);
                await this.updateSeries(seriesId, seriesInfo);
            } else {
                console.log(`Добавляем новый сериал ID: ${seriesId}...`);
                await this.insertSeries(seriesInfo);
            }

            // Импортируем связанные данные
            await this.importRelatedData(seriesId, seriesInfo, metadata);

            // Импортируем сезоны с эпизодами
            if (seasonsData && seasonsData.length > 0) {
                await this.importSeasonsWithEpisodes(seriesId, seasonsData);
            }

            await this.commit();
            console.log(`Сериал ID: ${seriesId} успешно импортирован`);

            return {
                success: true,
                seriesId: seriesId,
                title: data.seriesInfo.name,
                message: `Сериал ${data.seriesInfo.name} успешно импортирован`
            };

        } catch (error) {
            await this.rollback();
            console.error(`Ошибка импорта сериала ID: ${seriesId}:`, error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }

    /**
     * Получение данных из API с эпизодами
     */
    async fetchSeriesDataWithEpisodes(seriesId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/${seriesId}/seasons-with-episodes`);
            return response.data;
        } catch (error) {
            console.warn(`Не удалось получить данные с эпизодами для сериала ID: ${seriesId}. Пробуем базовый API...`);
            // Пробуем получить базовые данные
            const response = await axios.get(`${API_BASE_URL}/${seriesId}`);
            return response.data;
        }
    }

    /**
     * Проверка существования сериала
     */
    async checkSeriesExists(seriesId) {
        const conn = await this.connect();
        const [rows] = await conn.query(
            'SELECT id FROM tv_series WHERE id = ?',
            [seriesId]
        );
        return rows.length > 0;
    }

    /**
     * Вставка нового сериала
     */
    async insertSeries(data) {
        const conn = await this.connect();

        const sql = `
            INSERT INTO tv_series (
                id, name, original_name, overview, status, type, adult,
                backdrop_path, poster_path, homepage, tagline, original_language,
                first_air_date, last_air_date, in_production, number_of_episodes,
                number_of_seasons, popularity, vote_average, vote_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.id,
            data.name,
            data.original_name,
            data.overview || null,
            data.status,
            data.type,
            data.adult || false,
            data.backdrop_path,
            data.poster_path,
            data.homepage || null,
            data.tagline || null,
            data.original_language,
            data.first_air_date || null,
            data.last_air_date || null,
            data.in_production || false,
            data.number_of_episodes || 0,
            data.number_of_seasons || 0,
            data.popularity || 0,
            data.vote_average || 0,
            data.vote_count || 0
        ];

        await conn.query(sql, values);
    }

    /**
     * Обновление существующего сериала
     */
    async updateSeries(seriesId, data) {
        const conn = await this.connect();

        const sql = `
            UPDATE tv_series SET
                                 name = ?, original_name = ?, overview = ?, status = ?, type = ?, adult = ?,
                                 backdrop_path = ?, poster_path = ?, homepage = ?, tagline = ?, original_language = ?,
                                 first_air_date = ?, last_air_date = ?, in_production = ?, number_of_episodes = ?,
                                 number_of_seasons = ?, popularity = ?, vote_average = ?, vote_count = ?
            WHERE id = ?
        `;

        const values = [
            data.name,
            data.original_name,
            data.overview || null,
            data.status,
            data.type,
            data.adult || false,
            data.backdrop_path,
            data.poster_path,
            data.homepage || null,
            data.tagline || null,
            data.original_language,
            data.first_air_date || null,
            data.last_air_date || null,
            data.in_production || false,
            data.number_of_episodes || 0,
            data.number_of_seasons || 0,
            data.popularity || 0,
            data.vote_average || 0,
            data.vote_count || 0,
            seriesId
        ];

        await conn.query(sql, values);
    }

    /**
     * Импорт связанных данных
     */
    async importRelatedData(seriesId, data, metadata) {
        // Жанры
        if (data.genres && data.genres.length > 0) {
            await this.importGenres(data.genres);
            await this.importSeriesGenres(seriesId, data.genres);
        }

        // Языки
        if (data.spoken_languages && data.spoken_languages.length > 0) {
            await this.importSpokenLanguages(data.spoken_languages);
            await this.importSeriesSpokenLanguages(seriesId, data.spoken_languages);
        }

        // Производственные компании
        if (data.production_companies && data.production_companies.length > 0) {
            await this.importProductionCompanies(data.production_companies);
            await this.importSeriesProductionCompanies(seriesId, data.production_companies);
        }

        // Сети вещания
        if (data.networks && data.networks.length > 0) {
            await this.importNetworks(data.networks);
            await this.importSeriesNetworks(seriesId, data.networks);
        }

        // Страны происхождения
        if (data.origin_country && data.origin_country.length > 0) {
            await this.importSeriesOriginCountries(seriesId, data.origin_country);
        }

        // Страны производства
        if (data.production_countries && data.production_countries.length > 0) {
            await this.importProductionCountries(data.production_countries);
            await this.importSeriesProductionCountries(seriesId, data.production_countries);
        }

        // Метаданные
        if (metadata) {
            await this.importMetadata(seriesId, metadata);
        }
    }

    /**
     * Импорт сезонов с эпизодами
     */
    async importSeasonsWithEpisodes(seriesId, seasonsData) {
        const conn = await this.connect();

        for (const season of seasonsData) {
            if (!season.success) {
                console.warn(`Сезон ${season.season_number} не загружен, пропускаем...`);
                continue;
            }

            const seasonId = season.id;

            // Импортируем сезон
            await this.importSeason(seriesId, season);

            // Импортируем эпизоды
            if (season.episodesPreview && season.episodesPreview.length > 0) {
                await this.importEpisodesForSeason(seriesId, seasonId, season.season_number, season.episodesPreview);
            }
        }
    }

    /**
     * Импорт сезона
     */
    async importSeason(seriesId, seasonData) {
        const conn = await this.connect();

        // Проверяем, существует ли сезон
        const [existing] = await conn.query(
            'SELECT id FROM tv_seasons WHERE id = ?',
            [seasonData.id]
        );

        if (existing.length === 0) {
            await conn.query(
                `INSERT INTO tv_seasons (
                    id, series_id, season_number, name, overview, air_date,
                    episode_count, poster_path, vote_average
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    seasonData.id,
                    seriesId,
                    seasonData.season_number,
                    seasonData.name,
                    seasonData.overview || null,
                    seasonData.air_date || null,
                    seasonData.episode_count || 0,
                    seasonData.poster_path,
                    seasonData.vote_average || 0
                ]
            );
        } else {
            // Обновляем существующий сезон
            await conn.query(
                `UPDATE tv_seasons SET
                    series_id = ?, season_number = ?, name = ?, overview = ?, air_date = ?,
                    episode_count = ?, poster_path = ?, vote_average = ?
                WHERE id = ?`,
                [
                    seriesId,
                    seasonData.season_number,
                    seasonData.name,
                    seasonData.overview || null,
                    seasonData.air_date || null,
                    seasonData.episode_count || 0,
                    seasonData.poster_path,
                    seasonData.vote_average || 0,
                    seasonData.id
                ]
            );
        }
    }

    /**
     * Импорт эпизодов для сезона
     */
    async importEpisodesForSeason(seriesId, seasonId, seasonNumber, episodes) {
        const conn = await this.connect();

        for (const episode of episodes) {
            try {
                // Проверяем, существует ли эпизод
                // Для эпизодов без ID генерируем его
                const episodeId = this.generateEpisodeId(seriesId, seasonNumber, episode.episode_number);

                const [existing] = await conn.query(
                    'SELECT id FROM tv_episodes WHERE id = ?',
                    [episodeId]
                );

                if (existing.length === 0) {
                    await conn.query(
                        `INSERT INTO tv_episodes (
                            id, series_id, season_id, season_number, episode_number,
                            name, overview, air_date, runtime, vote_average, vote_count,
                            still_path
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            episodeId,
                            seriesId,
                            seasonId,
                            seasonNumber,
                            episode.episode_number,
                            episode.name,
                            episode.overview || null,
                            episode.air_date || null,
                            episode.runtime,
                            episode.vote_average || 0,
                            episode.vote_count || 0,
                            episode.still_path
                        ]
                    );
                } else {
                    // Обновляем существующий эпизод
                    await conn.query(
                        `UPDATE tv_episodes SET
                            series_id = ?, season_id = ?, season_number = ?, episode_number = ?,
                            name = ?, overview = ?, air_date = ?, runtime = ?, vote_average = ?, vote_count = ?,
                            still_path = ?
                        WHERE id = ?`,
                        [
                            seriesId,
                            seasonId,
                            seasonNumber,
                            episode.episode_number,
                            episode.name,
                            episode.overview || null,
                            episode.air_date || null,
                            episode.runtime,
                            episode.vote_average || 0,
                            episode.vote_count || 0,
                            episode.still_path,
                            episodeId
                        ]
                    );
                }
            } catch (error) {
                console.error(`Ошибка импорта эпизода S${seasonNumber}E${episode.episode_number}:`, error.message);
                // Продолжаем импорт остальных эпизодов
            }
        }
    }

    /**
     * Генерация ID для эпизода
     */
    generateEpisodeId(seriesId, seasonNumber, episodeNumber) {
        // Простая генерация: сериалID * 10000 + сезон * 100 + эпизод
        return seriesId * 10000 + seasonNumber * 100 + episodeNumber;
    }

    /**
     * Импорт жанров
     */
    async importGenres(genres) {
        const conn = await this.connect();

        for (const genre of genres) {
            // Проверяем, существует ли жанр
            const [existing] = await conn.query(
                'SELECT id FROM genres WHERE id = ?',
                [genre.id]
            );

            if (existing.length === 0) {
                await conn.query(
                    'INSERT INTO genres (id, name) VALUES (?, ?)',
                    [genre.id, genre.name]
                );
            } else {
                // Обновляем название, если изменилось
                await conn.query(
                    'UPDATE genres SET name = ? WHERE id = ?',
                    [genre.name, genre.id]
                );
            }
        }
    }

    /**
     * Связь сериалов с жанрами
     */
    async importSeriesGenres(seriesId, genres) {
        const conn = await this.connect();

        // Удаляем старые связи
        await conn.query(
            'DELETE FROM tv_series_genres WHERE series_id = ?',
            [seriesId]
        );

        // Добавляем новые связи
        for (const genre of genres) {
            try {
                await conn.query(
                    'INSERT INTO tv_series_genres (series_id, genre_id) VALUES (?, ?)',
                    [seriesId, genre.id]
                );
            } catch (error) {
                // Игнорируем ошибки дубликатов
                if (!error.message.includes('Duplicate entry')) {
                    throw error;
                }
            }
        }
    }

    /**
     * Импорт языков
     */
    async importSpokenLanguages(languages) {
        const conn = await this.connect();

        for (const lang of languages) {
            // Проверяем, существует ли язык
            const [existing] = await conn.query(
                'SELECT iso_code FROM spoken_languages WHERE iso_code = ?',
                [lang.iso_639_1]
            );

            if (existing.length === 0) {
                await conn.query(
                    'INSERT INTO spoken_languages (iso_code, name, english_name) VALUES (?, ?, ?)',
                    [lang.iso_639_1, lang.name, lang.english_name]
                );
            }
        }
    }

    /**
     * Связь сериалов с языками
     */
    async importSeriesSpokenLanguages(seriesId, languages) {
        const conn = await this.connect();

        // Удаляем старые связи
        await conn.query(
            'DELETE FROM tv_series_spoken_languages WHERE series_id = ?',
            [seriesId]
        );

        // Добавляем новые связи
        for (const lang of languages) {
            try {
                await conn.query(
                    'INSERT INTO tv_series_spoken_languages (series_id, language_iso) VALUES (?, ?)',
                    [seriesId, lang.iso_639_1]
                );
            } catch (error) {
                if (!error.message.includes('Duplicate entry')) {
                    throw error;
                }
            }
        }
    }

    /**
     * Импорт производственных компаний
     */
    async importProductionCompanies(companies) {
        const conn = await this.connect();

        for (const company of companies) {
            // Проверяем, существует ли компания
            const [existing] = await conn.query(
                'SELECT id FROM production_companies WHERE id = ?',
                [company.id]
            );

            if (existing.length === 0) {
                await conn.query(
                    'INSERT INTO production_companies (id, name, logo_path, origin_country) VALUES (?, ?, ?, ?)',
                    [company.id, company.name, company.logo_path, company.origin_country || null]
                );
            }
        }
    }

    /**
     * Связь сериалов с компаниями
     */
    async importSeriesProductionCompanies(seriesId, companies) {
        const conn = await this.connect();

        // Удаляем старые связи
        await conn.query(
            'DELETE FROM tv_series_production_companies WHERE series_id = ?',
            [seriesId]
        );

        // Добавляем новые связи
        for (const company of companies) {
            try {
                await conn.query(
                    'INSERT INTO tv_series_production_companies (series_id, company_id) VALUES (?, ?)',
                    [seriesId, company.id]
                );
            } catch (error) {
                if (!error.message.includes('Duplicate entry')) {
                    throw error;
                }
            }
        }
    }

    /**
     * Импорт сетей вещания
     */
    async importNetworks(networks) {
        const conn = await this.connect();

        for (const network of networks) {
            // Проверяем, существует ли сеть
            const [existing] = await conn.query(
                'SELECT id FROM tv_networks WHERE id = ?',
                [network.id]
            );

            if (existing.length === 0) {
                await conn.query(
                    'INSERT INTO tv_networks (id, name, logo_path, origin_country) VALUES (?, ?, ?, ?)',
                    [network.id, network.name, network.logo_path, network.origin_country || '']
                );
            }
        }
    }

    /**
     * Связь сериалов с сетями
     */
    async importSeriesNetworks(seriesId, networks) {
        const conn = await this.connect();

        // Удаляем старые связи
        await conn.query(
            'DELETE FROM tv_series_networks WHERE series_id = ?',
            [seriesId]
        );

        // Добавляем новые связи
        for (const network of networks) {
            try {
                await conn.query(
                    'INSERT INTO tv_series_networks (series_id, network_id) VALUES (?, ?)',
                    [seriesId, network.id]
                );
            } catch (error) {
                if (!error.message.includes('Duplicate entry')) {
                    throw error;
                }
            }
        }
    }

    /**
     * Импорт стран происхождения
     */
    async importSeriesOriginCountries(seriesId, countries) {
        const conn = await this.connect();

        // Удаляем старые связи
        await conn.query(
            'DELETE FROM tv_series_origin_countries WHERE series_id = ?',
            [seriesId]
        );

        // Добавляем новые связи
        for (const countryCode of countries) {
            try {
                // Сначала проверяем, существует ли страна в справочнике
                const [existing] = await conn.query(
                    'SELECT iso_code FROM production_countries WHERE iso_code = ?',
                    [countryCode]
                );

                if (existing.length === 0) {
                    // Если страны нет, добавляем её с кодом как именем
                    await conn.query(
                        'INSERT INTO production_countries (iso_code, name) VALUES (?, ?)',
                        [countryCode, countryCode]
                    );
                }

                await conn.query(
                    'INSERT INTO tv_series_origin_countries (series_id, country_iso) VALUES (?, ?)',
                    [seriesId, countryCode]
                );
            } catch (error) {
                if (!error.message.includes('Duplicate entry')) {
                    throw error;
                }
            }
        }
    }

    /**
     * Импорт стран производства
     */
    async importProductionCountries(countries) {
        const conn = await this.connect();

        for (const country of countries) {
            // Проверяем, существует ли страна
            const [existing] = await conn.query(
                'SELECT iso_code FROM production_countries WHERE iso_code = ?',
                [country.iso_3166_1]
            );

            if (existing.length === 0) {
                await conn.query(
                    'INSERT INTO production_countries (iso_code, name) VALUES (?, ?)',
                    [country.iso_3166_1, country.name]
                );
            } else {
                // Обновляем название, если изменилось
                await conn.query(
                    'UPDATE production_countries SET name = ? WHERE iso_code = ?',
                    [country.name, country.iso_3166_1]
                );
            }
        }
    }

    /**
     * Связь сериалов со странами производства
     */
    async importSeriesProductionCountries(seriesId, countries) {
        const conn = await this.connect();

        // Удаляем старые связи
        await conn.query(
            'DELETE FROM tv_series_production_countries WHERE series_id = ?',
            [seriesId]
        );

        // Добавляем новые связи
        for (const country of countries) {
            try {
                await conn.query(
                    'INSERT INTO tv_series_production_countries (series_id, country_iso) VALUES (?, ?)',
                    [seriesId, country.iso_3166_1]
                );
            } catch (error) {
                if (!error.message.includes('Duplicate entry')) {
                    throw error;
                }
            }
        }
    }

    /**
     * Импорт метаданных
     */
    async importMetadata(seriesId, metadata) {
        const conn = await this.connect();

        await conn.query(
            `INSERT INTO metadata (
                series_id, language, proxy_used, number_of_seasons,
                number_of_episodes, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                seriesId,
                metadata.language,
                metadata.proxyUsed || false,
                metadata.numberOfSeasons || metadata.totalSeasons || 0,
                metadata.numberOfEpisodes || metadata.totalEpisodes || 0,
                metadata.timestamp ? new Date(metadata.timestamp) : new Date()
            ]
        );
    }

    /**
     * Массовый импорт нескольких сериалов
     */
    async importMultipleSeries(seriesIds) {
        const results = {
            successful: [],
            failed: [],
            total: seriesIds.length
        };

        for (const seriesId of seriesIds) {
            try {
                await this.importSeriesById(seriesId);
                results.successful.push(seriesId);
                console.log(`Успешно импортирован сериал ID: ${seriesId}`);
            } catch (error) {
                results.failed.push({
                    id: seriesId,
                    error: error.message
                });
                console.error(`Ошибка импорта сериала ID: ${seriesId}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Создание таблиц если их нет
     */
    async createTablesIfNotExist() {
        const conn = await this.connect();

        const tables = [
            // Создаем таблицы которые я предложил ранее
            `CREATE TABLE IF NOT EXISTS tv_series (
                id INT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                original_name VARCHAR(255),
                overview TEXT,
                status VARCHAR(50),
                type VARCHAR(50),
                adult BOOLEAN,
                backdrop_path VARCHAR(255),
                poster_path VARCHAR(255),
                homepage VARCHAR(500),
                tagline VARCHAR(500),
                original_language VARCHAR(10),
                first_air_date DATE,
                last_air_date DATE,
                in_production BOOLEAN,
                number_of_episodes INT,
                number_of_seasons INT,
                popularity DECIMAL(10,4),
                vote_average DECIMAL(3,1),
                vote_count INT
            )`,

            `CREATE TABLE IF NOT EXISTS tv_seasons (
                id INT PRIMARY KEY,
                series_id INT,
                season_number INT NOT NULL,
                name VARCHAR(255),
                overview TEXT,
                air_date DATE,
                episode_count INT,
                poster_path VARCHAR(255),
                vote_average DECIMAL(3,1),
                FOREIGN KEY (series_id) REFERENCES tv_series(id)
            )`,

            `CREATE TABLE IF NOT EXISTS tv_episodes (
                id INT PRIMARY KEY,
                series_id INT,
                season_id INT,
                season_number INT,
                episode_number INT,
                name VARCHAR(255) NOT NULL,
                overview TEXT,
                air_date DATE,
                runtime INT,
                episode_type VARCHAR(50),
                production_code VARCHAR(50),
                still_path VARCHAR(255),
                vote_average DECIMAL(3,1),
                vote_count INT,
                FOREIGN KEY (series_id) REFERENCES tv_series(id),
                FOREIGN KEY (season_id) REFERENCES tv_seasons(id)
            )`,

            `CREATE TABLE IF NOT EXISTS tv_networks (
                id INT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                logo_path VARCHAR(255),
                origin_country VARCHAR(10)
            )`,

            `CREATE TABLE IF NOT EXISTS tv_series_genres (
                series_id INT,
                genre_id INT,
                PRIMARY KEY (series_id, genre_id),
                FOREIGN KEY (series_id) REFERENCES tv_series(id),
                FOREIGN KEY (genre_id) REFERENCES genres(id)
            )`,

            `CREATE TABLE IF NOT EXISTS tv_series_spoken_languages (
                series_id INT,
                language_iso VARCHAR(10),
                PRIMARY KEY (series_id, language_iso),
                FOREIGN KEY (series_id) REFERENCES tv_series(id),
                FOREIGN KEY (language_iso) REFERENCES spoken_languages(iso_code)
            )`,

            `CREATE TABLE IF NOT EXISTS tv_series_production_companies (
                series_id INT,
                company_id INT,
                PRIMARY KEY (series_id, company_id),
                FOREIGN KEY (series_id) REFERENCES tv_series(id),
                FOREIGN KEY (company_id) REFERENCES production_companies(id)
            )`,

            `CREATE TABLE IF NOT EXISTS tv_series_networks (
                series_id INT,
                network_id INT,
                PRIMARY KEY (series_id, network_id),
                FOREIGN KEY (series_id) REFERENCES tv_series(id),
                FOREIGN KEY (network_id) REFERENCES tv_networks(id)
            )`,

            `CREATE TABLE IF NOT EXISTS tv_series_origin_countries (
                series_id INT,
                country_iso VARCHAR(10),
                PRIMARY KEY (series_id, country_iso),
                FOREIGN KEY (series_id) REFERENCES tv_series(id),
                FOREIGN KEY (country_iso) REFERENCES production_countries(iso_code)
            )`,

            `CREATE TABLE IF NOT EXISTS tv_series_production_countries (
                series_id INT,
                country_iso VARCHAR(10),
                PRIMARY KEY (series_id, country_iso),
                FOREIGN KEY (series_id) REFERENCES tv_series(id),
                FOREIGN KEY (country_iso) REFERENCES production_countries(iso_code)
            )`,

            `CREATE TABLE IF NOT EXISTS metadata (
                id INT AUTO_INCREMENT PRIMARY KEY,
                series_id INT,
                language VARCHAR(10),
                proxy_used BOOLEAN,
                number_of_seasons INT,
                number_of_episodes INT,
                timestamp DATETIME,
                FOREIGN KEY (series_id) REFERENCES tv_series(id)
            )`
        ];

        for (const tableSql of tables) {
            try {
                await conn.query(tableSql);
            } catch (error) {
                console.error('Ошибка создания таблицы:', error.message);
            }
        }
    }
}