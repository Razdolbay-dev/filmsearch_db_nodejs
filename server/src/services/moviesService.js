import { pool } from '../config/database.js';

class MoviesService {
    constructor() {
        this.pool = pool;
    }

    // Получить все фильмы с пагинацией
    // async getAllMovies(page = 1, limit = 20) {
    //     const offset = (page - 1) * limit;
    //
    //     const [rows] = await this.pool.execute(
    //         'SELECT * FROM movies ORDER BY release_date DESC LIMIT ? OFFSET ?',
    //         [limit, offset]
    //     );
    //
    //     const [total] = await this.pool.execute(
    //         'SELECT COUNT(*) as count FROM movies'
    //     );
    //
    //     return {
    //         data: rows,
    //         pagination: {
    //             page,
    //             limit,
    //             total: total[0].count,
    //             pages: Math.ceil(total[0].count / limit)
    //         }
    //     };
    // }

    async getAllMovies(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        // Получаем отфильтрованные фильмы с пагинацией
        const [rows] = await this.pool.execute(`
        SELECT * FROM movies 
        WHERE overview IS NOT NULL 
        AND overview != '' 
        AND title REGEXP '[а-яА-ЯёЁ]'
        ORDER BY release_date DESC 
        LIMIT ? OFFSET ?
    `, [limit, offset]);

        // Получаем общее количество отфильтрованных фильмов
        const [total] = await this.pool.execute(`
        SELECT COUNT(*) as count FROM movies 
        WHERE overview IS NOT NULL 
        AND overview != '' 
        AND title REGEXP '[а-яА-ЯёЁ]'
    `);

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

    // Получить фильм по ID
    async getMovieById(id) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM movies WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return null;
        }

        const movie = rows[0];

        // Получаем жанры фильма
        const [genres] = await this.pool.execute(
            `SELECT g.* FROM genres g
             INNER JOIN movie_genres mg ON mg.genre_id = g.id
             WHERE mg.movie_id = ?`,
            [id]
        );

        // Получаем производственные компании
        const [companies] = await this.pool.execute(
            `SELECT pc.* FROM production_companies pc
             INNER JOIN movie_production_companies mpc ON mpc.company_id = pc.id
             WHERE mpc.movie_id = ?`,
            [id]
        );

        // Получаем страны производства
        const [countries] = await this.pool.execute(
            `SELECT pc.* FROM production_countries pc
             INNER JOIN movie_production_countries mpc ON mpc.country_iso = pc.iso_code
             WHERE mpc.movie_id = ?`,
            [id]
        );

        // Получаем языки
        const [languages] = await this.pool.execute(
            `SELECT sl.* FROM spoken_languages sl
             INNER JOIN movie_spoken_languages msl ON msl.language_iso = sl.iso_code
             WHERE msl.movie_id = ?`,
            [id]
        );

        return {
            ...movie,
            genres,
            production_companies: companies,
            production_countries: countries,
            spoken_languages: languages
        };
    }

    // Поиск фильмов по названию
    async searchMovies(query, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const searchQuery = `%${query}%`;

        const [rows] = await this.pool.execute(
            `SELECT * FROM movies 
             WHERE title LIKE ? OR original_title LIKE ? 
             ORDER BY popularity DESC 
             LIMIT ? OFFSET ?`,
            [searchQuery, searchQuery, limit, offset]
        );

        const [total] = await this.pool.execute(
            `SELECT COUNT(*) as count FROM movies 
             WHERE title LIKE ? OR original_title LIKE ?`,
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

    // Получить фильмы по жанру
    async getMoviesByGenre(genreId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await this.pool.execute(
            `SELECT m.* FROM movies m
             INNER JOIN movie_genres mg ON mg.movie_id = m.id
             WHERE mg.genre_id = ?
             ORDER BY m.popularity DESC
             LIMIT ? OFFSET ?`,
            [genreId, limit, offset]
        );

        const [total] = await this.pool.execute(
            `SELECT COUNT(*) as count FROM movie_genres WHERE genre_id = ?`,
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

    // Получить популярные фильмы
    async getPopularMovies(limit = 20) {
        const [rows] = await this.pool.execute(
            'SELECT * FROM movies ORDER BY popularity DESC LIMIT ?',
            [limit]
        );

        return rows;
    }

    // Получить фильмы по году
    async getMoviesByYear(year, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await this.pool.execute(
            'SELECT * FROM movies WHERE YEAR(release_date) = ? ORDER BY popularity DESC LIMIT ? OFFSET ?',
            [year, limit, offset]
        );

        const [total] = await this.pool.execute(
            'SELECT COUNT(*) as count FROM movies WHERE YEAR(release_date) = ?',
            [year]
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

export default MoviesService;