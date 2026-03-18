// services/mainService.js
import { pool } from '../config/database.js'; // твой подключенный пул к БД (mysql2/promise или аналогичный)

/**
 * Добавляет контент в исключения и удаляет из основной таблицы со всеми связями
 * @param {number} id - ID контента из TMDB
 * @param {'movie'|'series'} mediaType - тип контента
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function excludeContent(id, mediaType) {
    // Валидация входных данных
    if (!id || typeof id !== 'number' || id <= 0) {
        return {
            success: false,
            message: 'Некорректный ID. Должен быть положительным числом'
        };
    }

    if (!['movie', 'series'].includes(mediaType)) {
        return {
            success: false,
            message: 'Некорректный тип контента. Допустимо: movie или series'
        };
    }

    const isMovie = mediaType === 'movie';
    const mainTable = isMovie ? 'movies' : 'tv_series';

    // Начинаем транзакцию
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Проверяем, не исключён ли уже этот контент
        const [existing] = await connection.execute(
            'SELECT tmdb_id FROM content_exclusions WHERE tmdb_id = ? AND media_type = ?',
            [id, mediaType]
        );

        if (existing.length > 0) {
            await connection.rollback();
            connection.release();
            return {
                success: false,
                message: `Контент с ID ${id} и типом ${mediaType} уже в списке исключений`
            };
        }

        // 2. Получаем внутренний ID контента
        const [content] = await connection.execute(
            `SELECT id FROM ${mainTable} WHERE id = ?`,
            [id]
        );

        if (content.length === 0) {
            // Контента нет в БД - просто добавляем в исключения
            await connection.execute(
                'INSERT INTO content_exclusions (tmdb_id, media_type) VALUES (?, ?)',
                [id, mediaType]
            );

            await connection.commit();
            connection.release();

            return {
                success: true,
                message: `ID ${id} (${mediaType}) добавлен в исключения. Контент не найден в БД`
            };
        }

        const contentId = content[0].id;

        // 3. Удаляем все связанные записи в правильном порядке

        if (isMovie) {
            // Для фильмов - порядок важен из-за внешних ключей

            // Сначала удаляем связи из таблиц many-to-many
            await connection.execute('DELETE FROM movie_genres WHERE movie_id = ?', [contentId]);
            await connection.execute('DELETE FROM movie_production_companies WHERE movie_id = ?', [contentId]);
            await connection.execute('DELETE FROM movie_production_countries WHERE movie_id = ?', [contentId]);
            await connection.execute('DELETE FROM movie_spoken_languages WHERE movie_id = ?', [contentId]);

            // Проверяем, есть ли другие связанные таблицы для фильмов
            // (если есть movie_cast, movie_crew, movie_videos, movie_images, movie_keywords - добавляем их)
            try {
                await connection.execute('DELETE FROM movie_cast WHERE movie_id = ?', [contentId]);
            } catch (e) {
                // Таблицы может не существовать, игнорируем ошибку
            }
            try {
                await connection.execute('DELETE FROM movie_crew WHERE movie_id = ?', [contentId]);
            } catch (e) {}
            try {
                await connection.execute('DELETE FROM movie_videos WHERE movie_id = ?', [contentId]);
            } catch (e) {}
            try {
                await connection.execute('DELETE FROM movie_images WHERE movie_id = ?', [contentId]);
            } catch (e) {}
            try {
                await connection.execute('DELETE FROM movie_keywords WHERE movie_id = ?', [contentId]);
            } catch (e) {}

        }
        else {
            // Для сериалов - нужно удалять в строгом порядке: эпизоды -> сезоны -> связи -> сериал

            // 3.1. Получаем все сезоны этого сериала
            const [seasons] = await connection.execute(
                'SELECT id FROM tv_seasons WHERE series_id = ?',
                [contentId]
            );

            // 3.2. Для каждого сезона удаляем эпизоды
            for (const season of seasons) {
                await connection.execute(
                    'DELETE FROM tv_episodes WHERE season_id = ?',
                    [season.id]
                );
            }

            // 3.3. Удаляем сами сезоны
            await connection.execute(
                'DELETE FROM tv_seasons WHERE series_id = ?',
                [contentId]
            );

            // 3.4. Удаляем все связи many-to-many для сериала
            await connection.execute('DELETE FROM tv_series_genres WHERE series_id = ?', [contentId]);
            await connection.execute('DELETE FROM tv_series_networks WHERE series_id = ?', [contentId]);
            await connection.execute('DELETE FROM tv_series_origin_countries WHERE series_id = ?', [contentId]);
            await connection.execute('DELETE FROM tv_series_production_companies WHERE series_id = ?', [contentId]);
            await connection.execute('DELETE FROM tv_series_production_countries WHERE series_id = ?', [contentId]);
            await connection.execute('DELETE FROM tv_series_spoken_languages WHERE series_id = ?', [contentId]);

            // 3.5. Удаляем записи из metadata (если есть)
            await connection.execute('DELETE FROM metadata WHERE series_id = ?', [contentId]);

            // 3.6. Проверяем другие возможные таблицы
            try {
                await connection.execute('DELETE FROM tv_cast WHERE series_id = ?', [contentId]);
            } catch (e) {}
            try {
                await connection.execute('DELETE FROM tv_crew WHERE series_id = ?', [contentId]);
            } catch (e) {}
            try {
                await connection.execute('DELETE FROM tv_videos WHERE series_id = ?', [contentId]);
            } catch (e) {}
            try {
                await connection.execute('DELETE FROM tv_images WHERE series_id = ?', [contentId]);
            } catch (e) {}
            try {
                await connection.execute('DELETE FROM tv_keywords WHERE series_id = ?', [contentId]);
            } catch (e) {}
        }

        // 4. Теперь можно удалить сам контент
        const [deleteResult] = await connection.execute(
            `DELETE FROM ${mainTable} WHERE id = ?`,
            [contentId]
        );

        if (deleteResult.affectedRows === 0) {
            throw new Error(`Не удалось удалить контент из таблицы ${mainTable}`);
        }

        // 5. Добавляем в исключения
        await connection.execute(
            'INSERT INTO content_exclusions (tmdb_id, media_type) VALUES (?, ?)',
            [id, mediaType]
        );

        await connection.commit();
        connection.release();

        return {
            success: true,
            message: `Контент ID ${id} (${mediaType}) успешно исключён и удалён из БД`
        };

    } catch (error) {
        // Откатываем транзакцию в случае ошибки
        await connection.rollback();
        connection.release();

        console.error('Ошибка при исключении контента:', error);
        return {
            success: false,
            message: `Ошибка базы данных: ${error.message}`
        };
    }
}