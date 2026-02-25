import { pool } from '../config/database.js';

class CartoonsService {
    constructor() {
        this.pool = pool;
    }

    // Получить все мультфильмы (фильмы + сериалы)
    async getAllCartoons(page = 1, limit = 20, type = 'all') {
        const offset = (page - 1) * limit;
        console.log(`Выбран тип: ${type}`)

        // Базовые условия для фильмов
        let movieConditions = `
        mg.genre_id = 16 
        AND m.overview IS NOT NULL 
        AND m.overview != '' 
        AND m.title REGEXP '[а-яА-ЯёЁ]'
    `;

        // Базовые условия для сериалов
        let seriesConditions = `
        tsg.genre_id = 16 
        AND ts.overview IS NOT NULL 
        AND ts.overview != '' 
        AND ts.name REGEXP '[а-яА-ЯёЁ]'
    `;

        // Применяем фильтр по типу
        if (type === 'movies') {
            seriesConditions = '1=0'; // Не выбираем сериалы
        } else if (type === 'series') {
            movieConditions = '1=0'; // Не выбираем фильмы
        }

        // Получаем общее количество мультфильмов с учетом фильтра
        const [total] = await this.pool.execute(`
        SELECT 
            (SELECT COUNT(DISTINCT mg.movie_id) 
             FROM movie_genres mg 
             JOIN movies m ON m.id = mg.movie_id
             WHERE ${movieConditions}) +
            (SELECT COUNT(DISTINCT tsg.series_id) 
             FROM tv_series_genres tsg 
             JOIN tv_series ts ON ts.id = tsg.series_id
             WHERE ${seriesConditions}) as total
    `);

        // Получаем мультфильмы с пагинацией и учетом фильтра
        const [rows] = await this.pool.execute(`
        (
            -- Мультфильмы (фильмы)
            SELECT 
                m.id,
                m.title as name,
                m.overview,
                m.poster_path,
                m.backdrop_path,
                m.release_date as date,
                m.vote_average,
                m.vote_count,
                m.popularity,
                'movie' as content_type,
                NULL as number_of_seasons,
                NULL as number_of_episodes
            FROM movies m
            INNER JOIN movie_genres mg ON mg.movie_id = m.id
            WHERE ${movieConditions}
        )
        UNION ALL
        (
            -- Мультсериалы
            SELECT 
                ts.id,
                ts.name,
                ts.overview,
                ts.poster_path,
                ts.backdrop_path,
                ts.first_air_date as date,
                ts.vote_average,
                ts.vote_count,
                ts.popularity,
                'series' as content_type,
                ts.number_of_seasons,
                ts.number_of_episodes
            FROM tv_series ts
            INNER JOIN tv_series_genres tsg ON tsg.series_id = ts.id
            WHERE ${seriesConditions}
        )
        ORDER BY popularity DESC, date DESC
        LIMIT ? OFFSET ?
    `, [limit, offset]);

        // Преобразуем данные для единообразного формата
        const cartoons = rows.map(item => ({
            id: item.id,
            title: item.name,
            name: item.name,
            overview: item.overview,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            year: item.date ? new Date(item.date).getFullYear() : null,
            vote_average: parseFloat(item.vote_average) || 0,
            vote_count: item.vote_count || 0,
            popularity: parseFloat(item.popularity) || 0,
            type: item.content_type,
            seasons: item.number_of_seasons,
            episodes: item.number_of_episodes
        }));

        // Подсчитываем статистику с учетом фильтра
        const moviesCount = type === 'series' ? 0 : cartoons.filter(c => c.type === 'movie').length;
        const seriesCount = type === 'movies' ? 0 : cartoons.filter(c => c.type === 'series').length;

        return {
            data: cartoons,
            pagination: {
                page,
                limit,
                total: total[0].total,
                pages: Math.ceil(total[0].total / limit)
            },
            stats: {
                total: total[0].total,
                movies: moviesCount,
                series: seriesCount
            }
        };
    }

    // Получить популярные мультфильмы
    async getPopularCartoons(limit = 20) {
        const [rows] = await this.pool.execute(`
            (
                SELECT 
                    m.id,
                    m.title as name,
                    m.overview,
                    m.poster_path,
                    m.release_date as date,
                    m.vote_average,
                    m.popularity,
                    'movie' as content_type
                FROM movies m
                INNER JOIN movie_genres mg ON mg.movie_id = m.id
                WHERE mg.genre_id = 16 
                AND m.overview IS NOT NULL 
                AND m.overview != '' 
                AND m.title REGEXP '[а-яА-ЯёЁ]'
            )
            UNION ALL
            (
                SELECT 
                    ts.id,
                    ts.name,
                    ts.overview,
                    ts.poster_path,
                    ts.first_air_date as date,
                    ts.vote_average,
                    ts.popularity,
                    'series' as content_type
                FROM tv_series ts
                INNER JOIN tv_series_genres tsg ON tsg.series_id = ts.id
                WHERE tsg.genre_id = 16 
                AND ts.overview IS NOT NULL 
                AND ts.overview != '' 
                AND ts.name REGEXP '[а-яА-ЯёЁ]'
            )
            ORDER BY popularity DESC
            LIMIT ?
        `, [limit]);

        return rows.map(item => ({
            ...item,
            title: item.name,
            vote_average: parseFloat(item.vote_average) || 0
        }));
    }

    // Получить мультфильм по ID (определяем тип автоматически)
    async getCartoonById(id) {
        // Сначала проверяем, есть ли такой ID в фильмах
        const [movie] = await this.pool.execute(`
            SELECT 
                m.*,
                'movie' as content_type,
                GROUP_CONCAT(DISTINCT g.name) as genres
            FROM movies m
            LEFT JOIN movie_genres mg ON mg.movie_id = m.id
            LEFT JOIN genres g ON g.id = mg.genre_id
            WHERE m.id = ? AND mg.genre_id = 16
            GROUP BY m.id
        `, [id]);

        if (movie.length > 0) {
            return {
                ...movie[0],
                type: 'movie',
                genres: movie[0].genres ? movie[0].genres.split(',') : []
            };
        }

        // Если не фильм, проверяем сериалы
        const [series] = await this.pool.execute(`
            SELECT 
                ts.*,
                'series' as content_type,
                GROUP_CONCAT(DISTINCT g.name) as genres
            FROM tv_series ts
            LEFT JOIN tv_series_genres tsg ON tsg.series_id = ts.id
            LEFT JOIN genres g ON g.id = tsg.genre_id
            WHERE ts.id = ? AND tsg.genre_id = 16
            GROUP BY ts.id
        `, [id]);

        if (series.length > 0) {
            return {
                ...series[0],
                type: 'series',
                genres: series[0].genres ? series[0].genres.split(',') : []
            };
        }

        return null;
    }

    // Поиск по мультфильмам
    async searchCartoons(query, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const searchQuery = `%${query}%`;

        // Общее количество найденных
        const [total] = await this.pool.execute(`
            SELECT 
                (SELECT COUNT(DISTINCT mg.movie_id) 
                 FROM movie_genres mg 
                 JOIN movies m ON m.id = mg.movie_id
                 WHERE mg.genre_id = 16 
                 AND (m.title LIKE ? OR m.original_title LIKE ?)
                 AND m.overview IS NOT NULL 
                 AND m.overview != '') +
                (SELECT COUNT(DISTINCT tsg.series_id) 
                 FROM tv_series_genres tsg 
                 JOIN tv_series ts ON ts.id = tsg.series_id
                 WHERE tsg.genre_id = 16 
                 AND (ts.name LIKE ? OR ts.original_name LIKE ?)
                 AND ts.overview IS NOT NULL 
                 AND ts.overview != '') as total
        `, [searchQuery, searchQuery, searchQuery, searchQuery]);

        // Результаты поиска
        const [rows] = await this.pool.execute(`
            (
                SELECT 
                    m.id,
                    m.title as name,
                    m.overview,
                    m.poster_path,
                    m.release_date as date,
                    m.vote_average,
                    m.popularity,
                    'movie' as content_type
                FROM movies m
                INNER JOIN movie_genres mg ON mg.movie_id = m.id
                WHERE mg.genre_id = 16 
                AND (m.title LIKE ? OR m.original_title LIKE ?)
                AND m.overview IS NOT NULL 
                AND m.overview != ''
            )
            UNION ALL
            (
                SELECT 
                    ts.id,
                    ts.name,
                    ts.overview,
                    ts.poster_path,
                    ts.first_air_date as date,
                    ts.vote_average,
                    ts.popularity,
                    'series' as content_type
                FROM tv_series ts
                INNER JOIN tv_series_genres tsg ON tsg.series_id = ts.id
                WHERE tsg.genre_id = 16 
                AND (ts.name LIKE ? OR ts.original_name LIKE ?)
                AND ts.overview IS NOT NULL 
                AND ts.overview != ''
            )
            ORDER BY popularity DESC
            LIMIT ? OFFSET ?
        `, [searchQuery, searchQuery, searchQuery, searchQuery, limit, offset]);

        const cartoons = rows.map(item => ({
            id: item.id,
            title: item.name,
            name: item.name,
            overview: item.overview,
            poster_path: item.poster_path,
            year: item.date ? new Date(item.date).getFullYear() : null,
            vote_average: parseFloat(item.vote_average) || 0,
            popularity: parseFloat(item.popularity) || 0,
            type: item.content_type
        }));

        return {
            data: cartoons,
            pagination: {
                page,
                limit,
                total: total[0].total,
                pages: Math.ceil(total[0].total / limit)
            }
        };
    }

    // Получить мультфильмы по году
    async getCartoonsByYear(year, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const [rows] = await this.pool.execute(`
            (
                SELECT 
                    m.id,
                    m.title as name,
                    m.overview,
                    m.poster_path,
                    m.release_date as date,
                    m.vote_average,
                    m.popularity,
                    'movie' as content_type
                FROM movies m
                INNER JOIN movie_genres mg ON mg.movie_id = m.id
                WHERE mg.genre_id = 16 
                AND YEAR(m.release_date) = ?
                AND m.overview IS NOT NULL 
                AND m.overview != ''
            )
            UNION ALL
            (
                SELECT 
                    ts.id,
                    ts.name,
                    ts.overview,
                    ts.poster_path,
                    ts.first_air_date as date,
                    ts.vote_average,
                    ts.popularity,
                    'series' as content_type
                FROM tv_series ts
                INNER JOIN tv_series_genres tsg ON tsg.series_id = ts.id
                WHERE tsg.genre_id = 16 
                AND YEAR(ts.first_air_date) = ?
                AND ts.overview IS NOT NULL 
                AND ts.overview != ''
            )
            ORDER BY popularity DESC
            LIMIT ? OFFSET ?
        `, [year, year, limit, offset]);

        const [total] = await this.pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM movie_genres mg 
                 JOIN movies m ON m.id = mg.movie_id
                 WHERE mg.genre_id = 16 AND YEAR(m.release_date) = ?) +
                (SELECT COUNT(*) FROM tv_series_genres tsg 
                 JOIN tv_series ts ON ts.id = tsg.series_id
                 WHERE tsg.genre_id = 16 AND YEAR(ts.first_air_date) = ?) as total
        `, [year, year]);

        const cartoons = rows.map(item => ({
            id: item.id,
            title: item.name,
            name: item.name,
            overview: item.overview,
            poster_path: item.poster_path,
            year,
            vote_average: parseFloat(item.vote_average) || 0,
            popularity: parseFloat(item.popularity) || 0,
            type: item.content_type
        }));

        return {
            data: cartoons,
            pagination: {
                page,
                limit,
                total: total[0].total,
                pages: Math.ceil(total[0].total / limit)
            }
        };
    }
}

export default CartoonsService;