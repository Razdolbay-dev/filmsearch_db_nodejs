import { pool } from '../config/database.js';

class SeriesService {
    constructor() {
        this.pool = pool;
    }

    // Получить все сериалы с пагинацией
    async getAllSeries(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await this.pool.execute(
            'SELECT * FROM tv_series ORDER BY popularity DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const [total] = await this.pool.execute(
            'SELECT COUNT(*) as count FROM tv_series'
        );

        return {
            data: rows,
            pagination: {
                page,
                limit,
                total: total[0].count,
                pages: Math.ceil(total[0].count / limit)
            }
        };
    }

    // Получить сериал по ID
    async getSeriesById(id) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM tv_series WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return null;
        }

        const series = rows[0];

        // Получаем жанры
        const [genres] = await this.pool.execute(
            `SELECT g.* FROM genres g
             INNER JOIN tv_series_genres tsg ON tsg.genre_id = g.id
             WHERE tsg.series_id = ?`,
            [id]
        );

        // Получаем производственные компании
        const [companies] = await this.pool.execute(
            `SELECT pc.* FROM production_companies pc
             INNER JOIN tv_series_production_companies tspc ON tspc.company_id = pc.id
             WHERE tspc.series_id = ?`,
            [id]
        );

        // Получаем страны производства
        const [countries] = await this.pool.execute(
            `SELECT pc.* FROM production_countries pc
             INNER JOIN tv_series_production_countries tspc ON tspc.country_iso = pc.iso_code
             WHERE tspc.series_id = ?`,
            [id]
        );

        // Получаем языки
        const [languages] = await this.pool.execute(
            `SELECT sl.* FROM spoken_languages sl
             INNER JOIN tv_series_spoken_languages tssl ON tssl.language_iso = sl.iso_code
             WHERE tssl.series_id = ?`,
            [id]
        );

        // Получаем телеканалы
        const [networks] = await this.pool.execute(
            `SELECT tn.* FROM tv_networks tn
             INNER JOIN tv_series_networks tsn ON tsn.network_id = tn.id
             WHERE tsn.series_id = ?`,
            [id]
        );

        return {
            ...series,
            genres,
            production_companies: companies,
            production_countries: countries,
            spoken_languages: languages,
            networks
        };
    }

    // Поиск сериалов по названию
    async searchSeries(query, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const searchQuery = `%${query}%`;

        const [rows] = await this.pool.execute(
            `SELECT * FROM tv_series 
             WHERE name LIKE ? OR original_name LIKE ? 
             ORDER BY popularity DESC 
             LIMIT ? OFFSET ?`,
            [searchQuery, searchQuery, limit, offset]
        );

        const [total] = await this.pool.execute(
            `SELECT COUNT(*) as count FROM tv_series 
             WHERE name LIKE ? OR original_name LIKE ?`,
            [searchQuery, searchQuery]
        );

        return {
            data: rows,
            pagination: {
                page,
                limit,
                total: total[0].count,
                pages: Math.ceil(total[0].count / limit)
            }
        };
    }

    // Получить сериалы по жанру
    async getSeriesByGenre(genreId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await this.pool.execute(
            `SELECT ts.* FROM tv_series ts
             INNER JOIN tv_series_genres tsg ON tsg.series_id = ts.id
             WHERE tsg.genre_id = ?
             ORDER BY ts.popularity DESC
             LIMIT ? OFFSET ?`,
            [genreId, limit, offset]
        );

        const [total] = await this.pool.execute(
            `SELECT COUNT(*) as count FROM tv_series_genres WHERE genre_id = ?`,
            [genreId]
        );

        return {
            data: rows,
            pagination: {
                page,
                limit,
                total: total[0].count,
                pages: Math.ceil(total[0].count / limit)
            }
        };
    }

    // Получить популярные сериалы
    async getPopularSeries(limit = 20) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM tv_series ORDER BY popularity DESC LIMIT ?',
            [limit]
        );

        return rows;
    }

    // Получить сезоны сериала
    async getSeriesSeasons(seriesId) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM tv_seasons WHERE series_id = ? ORDER BY season_number',
            [seriesId]
        );

        return rows;
    }

    // Получить эпизоды сезона
    async getSeasonEpisodes(seasonId) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM tv_episodes WHERE season_id = ? ORDER BY episode_number',
            [seasonId]
        );

        return rows;
    }

    // Получить текущие в производстве сериалы
    async getInProductionSeries(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await this.pool.execute(
            'SELECT * FROM tv_series WHERE in_production = 1 ORDER BY popularity DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const [total] = await this.pool.execute(
            'SELECT COUNT(*) as count FROM tv_series WHERE in_production = 1'
        );

        return {
            data: rows,
            pagination: {
                page,
                limit,
                total: total[0].count,
                pages: Math.ceil(total[0].count / limit)
            }
        };
    }
}

export default SeriesService;