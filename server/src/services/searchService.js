import { pool } from '../config/database.js';

/**
 * Поиск контента по названию в таблицах movies и tv_series с пагинацией
 * @param {string} searchTerm - поисковый запрос
 * @param {number} page - номер страницы (начиная с 1)
 * @param {number} limit - количество элементов на странице
 * @returns {Promise<Object>} - объект с данными и метаинформацией
 */
export async function searchContent(searchTerm, page = 1, limit = 20) {
    // Валидация входных данных
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
        return {
            data: [],
            metadata: {
                total: 0,
                page: 1,
                limit: limit,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false
            }
        };
    }

    const searchPattern = `%${searchTerm.trim()}%`;
    const offset = (page - 1) * limit;
    const connection = await pool.getConnection();

    try {
        // Считаем общее количество найденных записей
        const countQuery = `
            SELECT
                (SELECT COUNT(*) FROM movies
                 WHERE published = 1
                   AND (title LIKE ? OR original_title LIKE ?)) as movies_count,
                (SELECT COUNT(*) FROM tv_series
                 WHERE published = 1
                   AND (name LIKE ? OR original_name LIKE ?)) as tv_series_count
        `;

        const [countResult] = await connection.execute(countQuery, [
            searchPattern, searchPattern,
            searchPattern, searchPattern
        ]);

        const totalMovies = countResult[0]?.movies_count || 0;
        const totalSeries = countResult[0]?.tv_series_count || 0;
        const totalItems = totalMovies + totalSeries;

        // Если ничего не найдено, возвращаем пустой результат
        if (totalItems === 0) {
            return {
                data: [],
                metadata: {
                    total: 0,
                    page: page,
                    limit: limit,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPrevPage: false,
                    moviesCount: 0,
                    seriesCount: 0
                }
            };
        }

        // Получаем данные с пагинацией
        const moviesQuery = `
            SELECT 
                id,
                title as name,
                original_title,
                overview,
                status,
                adult,
                backdrop_path,
                poster_path,
                homepage,
                tagline,
                original_language,
                release_date as air_date,
                popularity,
                vote_average,
                vote_count,
                published,
                'movie' as content_type,
                runtime,
                budget,
                revenue,
                imdb_id,
                NULL as type,
                NULL as in_production,
                NULL as number_of_episodes,
                NULL as number_of_seasons,
                NULL as last_air_date,
                'movie' as search_type
            FROM movies 
            WHERE published = 1 
                AND (title LIKE ? OR original_title LIKE ?)
        `;

        const tvSeriesQuery = `
            SELECT 
                id,
                name,
                original_name,
                overview,
                status,
                adult,
                backdrop_path,
                poster_path,
                homepage,
                tagline,
                original_language,
                first_air_date as air_date,
                popularity,
                vote_average,
                vote_count,
                published,
                'series' as content_type,
                NULL as runtime,
                NULL as budget,
                NULL as revenue,
                NULL as imdb_id,
                type,
                in_production,
                number_of_episodes,
                number_of_seasons,
                last_air_date,
                'series' as search_type
            FROM tv_series 
            WHERE published = 1 
                AND (name LIKE ? OR original_name LIKE ?)
        `;

        // Объединяем оба запроса с UNION ALL для пагинации
        const combinedQuery = `
            SELECT * FROM (${moviesQuery} UNION ALL ${tvSeriesQuery}) as combined
            ORDER BY popularity DESC
            LIMIT ? OFFSET ?
        `;

        const [results] = await connection.execute(combinedQuery, [
            searchPattern, searchPattern,
            searchPattern, searchPattern,
            parseInt(limit), parseInt(offset)
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            data: results,
            metadata: {
                total: totalItems,
                page: page,
                limit: limit,
                totalPages: totalPages,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                moviesCount: totalMovies,
                seriesCount: totalSeries
            }
        };

    } catch (error) {
        console.error('Ошибка в searchContent:', error);
        throw new Error(`Ошибка базы данных: ${error.message}`);
    } finally {
        connection.release();
    }
}

/**
 * Расширенный поиск с дополнительными параметрами и пагинацией
 * @param {Object} params - параметры поиска
 * @returns {Promise<Object>} - результаты поиска с метаданными
 */
export async function advancedSearch(params) {
    const {
        query,
        type = 'all', // 'movie', 'series', 'all'
        limit = 20,
        page = 1,
        sortBy = 'popularity',
        sortOrder = 'DESC',
        yearFrom = null,
        yearTo = null,
        minVoteAverage = null
    } = params;

    // Валидация входных данных
    if (!query || typeof query !== 'string' || query.trim() === '') {
        return {
            movies: { data: [], metadata: { total: 0, page, limit, totalPages: 0 } },
            series: { data: [], metadata: { total: 0, page, limit, totalPages: 0 } },
            total: 0
        };
    }

    const searchPattern = `%${query.trim()}%`;
    const offset = (page - 1) * limit;
    const connection = await pool.getConnection();

    try {
        let movies = { data: [], metadata: { total: 0, page, limit, totalPages: 0 } };
        let series = { data: [], metadata: { total: 0, page, limit, totalPages: 0 } };

        // Поиск в фильмах
        if (type === 'all' || type === 'movie') {
            let moviesQuery = `
                SELECT
                    id,
                    title as name,
                    original_title,
                    overview,
                    status,
                    adult,
                    backdrop_path,
                    poster_path,
                    homepage,
                    tagline,
                    original_language,
                    release_date as air_date,
                    popularity,
                    vote_average,
                    vote_count,
                    published,
                    'movie' as content_type,
                    runtime,
                    budget,
                    revenue,
                    imdb_id,
                    YEAR(release_date) as year
                FROM movies
                WHERE published = 1
                  AND (title LIKE ? OR original_title LIKE ?)
            `;

            const queryParams = [searchPattern, searchPattern];
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM movies 
                WHERE published = 1 
                    AND (title LIKE ? OR original_title LIKE ?)
            `;
            const countParams = [searchPattern, searchPattern];

            // Добавляем фильтр по году
            if (yearFrom) {
                moviesQuery += ` AND YEAR(release_date) >= ?`;
                queryParams.push(yearFrom);
                countQuery += ` AND YEAR(release_date) >= ?`;
                countParams.push(yearFrom);
            }
            if (yearTo) {
                moviesQuery += ` AND YEAR(release_date) <= ?`;
                queryParams.push(yearTo);
                countQuery += ` AND YEAR(release_date) <= ?`;
                countParams.push(yearTo);
            }

            // Добавляем фильтр по рейтингу
            if (minVoteAverage) {
                moviesQuery += ` AND vote_average >= ?`;
                queryParams.push(minVoteAverage);
                countQuery += ` AND vote_average >= ?`;
                countParams.push(minVoteAverage);
            }

            // Получаем общее количество
            const [countResult] = await connection.execute(countQuery, countParams);
            const totalMovies = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalMovies / limit);

            // Добавляем сортировку
            const validSortFields = ['popularity', 'vote_average', 'release_date', 'title'];
            const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'popularity';
            const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            moviesQuery += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

            // Добавляем пагинацию
            moviesQuery += ` LIMIT ? OFFSET ?`;
            queryParams.push(parseInt(limit), parseInt(offset));

            const [moviesResults] = await connection.execute(moviesQuery, queryParams);

            movies = {
                data: moviesResults,
                metadata: {
                    total: totalMovies,
                    page: page,
                    limit: limit,
                    totalPages: totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };
        }

        // Поиск в сериалах
        if (type === 'all' || type === 'series') {
            let seriesQuery = `
                SELECT
                    id,
                    name,
                    original_name,
                    overview,
                    status,
                    adult,
                    backdrop_path,
                    poster_path,
                    homepage,
                    tagline,
                    original_language,
                    first_air_date as air_date,
                    popularity,
                    vote_average,
                    vote_count,
                    published,
                    'series' as content_type,
                    type,
                    in_production,
                    number_of_episodes,
                    number_of_seasons,
                    last_air_date,
                    YEAR(first_air_date) as year
                FROM tv_series
                WHERE published = 1
                  AND (name LIKE ? OR original_name LIKE ?)
            `;

            const queryParams = [searchPattern, searchPattern];
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM tv_series 
                WHERE published = 1 
                    AND (name LIKE ? OR original_name LIKE ?)
            `;
            const countParams = [searchPattern, searchPattern];

            // Добавляем фильтр по году
            if (yearFrom) {
                seriesQuery += ` AND YEAR(first_air_date) >= ?`;
                queryParams.push(yearFrom);
                countQuery += ` AND YEAR(first_air_date) >= ?`;
                countParams.push(yearFrom);
            }
            if (yearTo) {
                seriesQuery += ` AND YEAR(first_air_date) <= ?`;
                queryParams.push(yearTo);
                countQuery += ` AND YEAR(first_air_date) <= ?`;
                countParams.push(yearTo);
            }

            // Добавляем фильтр по рейтингу
            if (minVoteAverage) {
                seriesQuery += ` AND vote_average >= ?`;
                queryParams.push(minVoteAverage);
                countQuery += ` AND vote_average >= ?`;
                countParams.push(minVoteAverage);
            }

            // Получаем общее количество
            const [countResult] = await connection.execute(countQuery, countParams);
            const totalSeries = countResult[0]?.total || 0;
            const totalPages = Math.ceil(totalSeries / limit);

            // Добавляем сортировку
            const validSortFields = ['popularity', 'vote_average', 'first_air_date', 'name'];
            const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'popularity';
            const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            seriesQuery += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

            // Добавляем пагинацию
            seriesQuery += ` LIMIT ? OFFSET ?`;
            queryParams.push(parseInt(limit), parseInt(offset));

            const [seriesResults] = await connection.execute(seriesQuery, queryParams);

            series = {
                data: seriesResults,
                metadata: {
                    total: totalSeries,
                    page: page,
                    limit: limit,
                    totalPages: totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };
        }

        return {
            movies: type === 'all' || type === 'movie' ? movies : { data: [], metadata: { total: 0 } },
            series: type === 'all' || type === 'series' ? series : { data: [], metadata: { total: 0 } },
            total: movies.metadata.total + series.metadata.total
        };

    } catch (error) {
        console.error('Ошибка в advancedSearch:', error);
        throw new Error(`Ошибка базы данных: ${error.message}`);
    } finally {
        connection.release();
    }
}

/**
 * Поиск с авто-дополнением (без пагинации, только топ результатов)
 * @param {string} searchTerm - поисковый запрос
 * @param {number} limit - лимит результатов
 * @returns {Promise<Array>} - массив предложений
 */
export async function searchSuggestions(searchTerm, limit = 10) {
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < 2) {
        return [];
    }

    const searchPattern = `%${searchTerm.trim()}%`;
    const connection = await pool.getConnection();

    try {
        const moviesQuery = `
            SELECT
                id,
                title as name,
                'movie' as type,
                poster_path as poster,
                release_date as air_date,
                vote_average
            FROM movies
            WHERE published = 1
              AND (title LIKE ? OR original_title LIKE ?)
            ORDER BY popularity DESC
                LIMIT ?
        `;

        const seriesQuery = `
            SELECT
                id,
                name,
                'series' as type,
                poster_path as poster,
                first_air_date as air_date,
                vote_average
            FROM tv_series
            WHERE published = 1
              AND (name LIKE ? OR original_name LIKE ?)
            ORDER BY popularity DESC
                LIMIT ?
        `;

        const [movies, series] = await Promise.all([
            connection.execute(moviesQuery, [searchPattern, searchPattern, limit]),
            connection.execute(seriesQuery, [searchPattern, searchPattern, limit])
        ]);

        const suggestions = [...movies[0], ...series[0]].map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            poster: item.poster,
            year: item.air_date ? new Date(item.air_date).getFullYear() : null,
            vote_average: item.vote_average
        }));

        return suggestions
            .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
            .slice(0, limit);

    } catch (error) {
        console.error('Ошибка в searchSuggestions:', error);
        throw new Error(`Ошибка базы данных: ${error.message}`);
    } finally {
        connection.release();
    }
}

/**
 * Получение детальной информации о контенте
 * @param {number} id - ID контента
 * @param {'movie'|'series'} type - тип контента
 * @returns {Promise<Object|null>} - детальная информация
 */
export async function getContentDetails(id, type) {
    if (!id || typeof id !== 'number' || id <= 0) {
        throw new Error('Некорректный ID. Должен быть положительным числом');
    }

    if (!['movie', 'series'].includes(type)) {
        throw new Error('Некорректный тип контента. Допустимо: movie или series');
    }

    const connection = await pool.getConnection();

    try {
        let query = '';

        if (type === 'movie') {
            query = `
                SELECT
                    id,
                    title as name,
                    original_title,
                    overview,
                    status,
                    adult,
                    backdrop_path,
                    poster_path,
                    homepage,
                    tagline,
                    original_language,
                    release_date as air_date,
                    popularity,
                    vote_average,
                    vote_count,
                    published,
                    'movie' as content_type,
                    runtime,
                    budget,
                    revenue,
                    imdb_id
                FROM movies
                WHERE id = ? AND published = 1
            `;
        } else {
            query = `
                SELECT 
                    id,
                    name,
                    original_name,
                    overview,
                    status,
                    adult,
                    backdrop_path,
                    poster_path,
                    homepage,
                    tagline,
                    original_language,
                    first_air_date as air_date,
                    popularity,
                    vote_average,
                    vote_count,
                    published,
                    'series' as content_type,
                    type,
                    in_production,
                    number_of_episodes,
                    number_of_seasons,
                    last_air_date
                FROM tv_series 
                WHERE id = ? AND published = 1
            `;
        }

        const [results] = await connection.execute(query, [id]);

        if (results.length === 0) {
            return null;
        }

        return results[0];

    } catch (error) {
        console.error('Ошибка в getContentDetails:', error);
        throw new Error(`Ошибка базы данных: ${error.message}`);
    } finally {
        connection.release();
    }
}