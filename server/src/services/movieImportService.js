import { pool } from "../config/database.js";
import axios from 'axios';

// URL API
const API_BASE_URL = 'http://127.0.0.1:5000/api/tmdb_movies';

export class MovieImportService {
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

    // async fetchAndStoreMovie(movieId) {
    //     let connection = null;
    //
    //     try {
    //         console.log(`Запрашиваю данные фильма с ID: ${movieId}...`);
    //
    //         // Получаем данные фильма
    //         const response = await axios.get(`${API_BASE_URL}/${movieId}`);
    //
    //         if (!response.data.success) {
    //             throw new Error(`API вернуло ошибку: ${JSON.stringify(response.data)}`);
    //         }
    //
    //         const movieData = response.data.data;
    //         const metadata = response.data.metadata;
    //
    //         // Проверка статуса и даты релиза
    //         if (movieData.status !== 'Released') {
    //             console.log(`❌ Фильм имеет статус "${movieData.status}", а не "Released". Импорт отменен.`);
    //             return {
    //                 success: false,
    //                 skipped: true,  // <-- добавить
    //                 movieId: movieId,
    //                 status: movieData.status,
    //                 reason: `Фильм не выпущен (статус: ${movieData.status})`
    //             };
    //         }
    //
    //         // Проверяем, что дата релиза не в будущем
    //         if (movieData.release_date) {
    //             const releaseDate = new Date(movieData.release_date);
    //             const currentDate = new Date();
    //
    //             if (releaseDate > currentDate) {
    //                 console.log(`❌ Дата релиза ${movieData.release_date} еще не наступила. Импорт отменен.`);
    //                 return {
    //                     success: false,
    //                     movieId: movieId,
    //                     releaseDate: movieData.release_date,
    //                     currentDate: currentDate.toISOString().split('T')[0],
    //                     reason: `Дата релиза еще не наступила`
    //                 };
    //             }
    //         }
    //
    //         console.log(`Фильм получен: ${movieData.title}`);
    //
    //         // Получаем соединение
    //         connection = await this.connect();
    //         console.log('Подключение к базе данных установлено');
    //
    //         // Начинаем транзакцию
    //         await this.beginTransaction();
    //         console.log('Транзакция начата');
    //
    //         // 1. Вставляем основной фильм
    //         console.log('Добавляю основную информацию о фильме...');
    //         await this.insertMovie(movieData, metadata);
    //
    //         // 2. Вставляем и связываем жанры
    //         if (movieData.genres && movieData.genres.length > 0) {
    //             console.log('Добавляю жанры...');
    //             await this.insertGenres(movieData.genres);
    //             await this.linkMovieGenres(movieId, movieData.genres);
    //         }
    //
    //         // 3. Вставляем и связываем компании
    //         if (movieData.production_companies && movieData.production_companies.length > 0) {
    //             console.log('Добавляю производственные компании...');
    //             await this.insertProductionCompanies(movieData.production_companies);
    //             await this.linkMovieCompanies(movieId, movieData.production_companies);
    //         }
    //
    //         // 4. Вставляем и связываем страны
    //         if (movieData.production_countries && movieData.production_countries.length > 0) {
    //             console.log('Добавляю страны производства...');
    //             await this.insertProductionCountries(movieData.production_countries);
    //             await this.linkMovieCountries(movieId, movieData.production_countries);
    //         }
    //
    //         // 5. Вставляем и связываем языки
    //         if (movieData.spoken_languages && movieData.spoken_languages.length > 0) {
    //             console.log('Добавляю языки...');
    //             await this.insertSpokenLanguages(movieData.spoken_languages);
    //             await this.linkMovieLanguages(movieId, movieData.spoken_languages);
    //         }
    //
    //         // Фиксируем транзакцию
    //         await this.commit();
    //         console.log('✅ Все данные успешно сохранены в базе данных!');
    //
    //         return {
    //             success: true,
    //             movieId: movieId,
    //             title: movieData.title,
    //             message: 'Фильм успешно импортирован'
    //         };
    //
    //     } catch (error) {
    //         // Откатываем транзакцию в случае ошибки
    //         if (this.connection) {
    //             await this.rollback();
    //         }
    //
    //         console.error('❌ Ошибка:', error.message);
    //
    //         if (error.response) {
    //             console.error('Статус ошибки:', error.response.status);
    //             console.error('Данные ошибки:', error.response.data);
    //         }
    //
    //         return {
    //             success: false,
    //             movieId: movieId,
    //             error: error.message,
    //             status: error.response?.status
    //         };
    //
    //     } finally {
    //         // Закрываем соединение
    //         if (connection) {
    //             await this.disconnect();
    //             console.log('Соединение с базой данных закрыто');
    //         }
    //     }
    // }
    /**
     * Проверяет, нужно ли обновлять фильм
     */
    async needsUpdate(movieId, newData) {
        const connection = await this.connect();

        // Получаем текущие данные из БД
        const [rows] = await connection.execute(
            `SELECT overview, title, original_title, popularity, vote_average, vote_count, 
                release_date, status, tagline, poster_path, backdrop_path
         FROM movies WHERE id = ?`,
            [movieId]
        );

        if (rows.length === 0) return true; // Записи нет - нужно вставить

        const current = rows[0];

        // Критичные поля, изменения которых требуют обновления
        const criticalChanges = [
            // overview был пустой, а теперь есть (наше основное условие)
            (!current.overview || current.overview === '') && newData.overview,

            // Изменилось название (особенно важно для проверки кириллицы)
            current.title !== newData.title,
            current.original_title !== newData.original_title,

            // Статус изменился (например, был Planned, стал Released)
            current.status !== newData.status,

            // Дата релиза изменилась
            current.release_date !== newData.release_date
        ];

        // Если есть критические изменения - обновляем
        if (criticalChanges.some(change => change === true)) {
            console.log(`🔄 Критические изменения для фильма ID: ${movieId}`);
            return true;
        }

        // Второстепенные поля - обновляем только при значительных изменениях
        const significantChanges = [
            Math.abs(current.popularity - (newData.popularity || 0)) > 0.5,
            Math.abs(current.vote_average - (newData.vote_average || 0)) > 0.1,
            current.vote_count !== newData.vote_count,
            current.poster_path !== newData.poster_path,
            current.backdrop_path !== newData.backdrop_path,
            current.tagline !== newData.tagline
        ];

        const needsUpdate = significantChanges.some(change => change === true);

        if (needsUpdate) {
            console.log(`📊 Значительные изменения метрик для фильма ID: ${movieId}`);
        }

        return needsUpdate;
    }

    /**
     * Основной метод импорта фильма по ID
     */
    async fetchAndStoreMovie(movieId) {
        let connection = null;

        try {
            console.log(`🔍 Запрашиваю данные фильма с ID: ${movieId}...`);

            // Получаем данные фильма
            const response = await axios.get(`${API_BASE_URL}/${movieId}`);

            if (!response.data.success) {
                throw new Error(`API вернуло ошибку: ${JSON.stringify(response.data)}`);
            }

            const movieData = response.data.data;
            const metadata = response.data.metadata;

            // Проверка статуса и даты релиза
            if (movieData.status !== 'Released') {
                console.log(`⏭️ Фильм ID: ${movieId} имеет статус "${movieData.status}", а не "Released". Пропускаем.`);
                return {
                    success: false,
                    skipped: true,
                    movieId: movieId,
                    status: movieData.status,
                    reason: `Фильм не выпущен (статус: ${movieData.status})`
                };
            }

            // Проверяем, что дата релиза не в будущем
            if (movieData.release_date) {
                const releaseDate = new Date(movieData.release_date);
                const currentDate = new Date();

                if (releaseDate > currentDate) {
                    console.log(`⏭️ Дата релиза ${movieData.release_date} еще не наступила. Пропускаем.`);
                    return {
                        success: false,
                        skipped: true,
                        movieId: movieId,
                        releaseDate: movieData.release_date,
                        currentDate: currentDate.toISOString().split('T')[0],
                        reason: `Дата релиза еще не наступила`
                    };
                }
            }

            console.log(`✅ Фильм получен: ${movieData.title}`);

            // Получаем соединение
            connection = await this.connect();

            // *** НОВАЯ ЛОГИКА: Проверяем нужно ли обновление ***
            const needsUpdate = await this.needsUpdate(movieId, movieData);

            if (!needsUpdate) {
                console.log(`⏭️ Фильм ID: ${movieId} не требует обновления (данные актуальны)`);
                return {
                    success: true,
                    skipped: true,
                    movieId: movieId,
                    title: movieData.title,
                    reason: 'Данные актуальны, обновление не требуется'
                };
            }

            console.log(`🔄 Фильм ID: ${movieId} требует обновления...`);

            // Начинаем транзакцию
            await this.beginTransaction();
            console.log('📦 Транзакция начата');

            // 1. Вставляем/обновляем основной фильм
            console.log('💾 Сохраняю основную информацию о фильме...');
            await this.insertMovie(movieData, metadata);

            // 2. Вставляем и связываем жанры
            if (movieData.genres && movieData.genres.length > 0) {
                console.log('🏷️ Добавляю жанры...');
                await this.insertGenres(movieData.genres);
                await this.linkMovieGenres(movieId, movieData.genres);
            }

            // 3. Вставляем и связываем компании
            if (movieData.production_companies && movieData.production_companies.length > 0) {
                console.log('🏢 Добавляю производственные компании...');
                await this.insertProductionCompanies(movieData.production_companies);
                await this.linkMovieCompanies(movieId, movieData.production_companies);
            }

            // 4. Вставляем и связываем страны
            if (movieData.production_countries && movieData.production_countries.length > 0) {
                console.log('🌍 Добавляю страны производства...');
                await this.insertProductionCountries(movieData.production_countries);
                await this.linkMovieCountries(movieId, movieData.production_countries);
            }

            // 5. Вставляем и связываем языки
            if (movieData.spoken_languages && movieData.spoken_languages.length > 0) {
                console.log('🗣️ Добавляю языки...');
                await this.insertSpokenLanguages(movieData.spoken_languages);
                await this.linkMovieLanguages(movieId, movieData.spoken_languages);
            }

            // Фиксируем транзакцию
            await this.commit();
            console.log(`✅ Фильм ID: ${movieId} "${movieData.title}" успешно импортирован!`);

            return {
                success: true,
                movieId: movieId,
                title: movieData.title,
                message: 'Фильм успешно импортирован'
            };

        } catch (error) {
            // Откатываем транзакцию в случае ошибки
            if (this.connection) {
                await this.rollback();
            }

            console.error(`❌ Ошибка импорта фильма ID: ${movieId}:`, error.message);

            if (error.response) {
                console.error('📡 Статус ошибки API:', error.response.status);
            }

            return {
                success: false,
                movieId: movieId,
                error: error.message,
                status: error.response?.status
            };

        } finally {
            // Закрываем соединение
            if (connection) {
                await this.disconnect();
            }
        }
    }

    async insertMovie(movieData, metadata) {
        const connection = await this.connect();

        // Определяем published на лету
        const hasOverview = movieData.overview && movieData.overview.trim() !== '';
        const hasCyrillicTitle = movieData.title && /[а-яА-ЯёЁ]/.test(movieData.title);

        // published = 1 только если есть описание И название на кириллице
        const published = (hasOverview && hasCyrillicTitle) ? 1 : 0;

        console.log(`📊 Для фильма ID: ${movieData.id} 
        hasOverview: ${hasOverview}, 
        hasCyrillicTitle: ${hasCyrillicTitle}, 
        published: ${published}
        ${published === 1 ? '✅ Будет показываться' : '❌ Будет скрыт'}`);

        const query = `
        INSERT INTO movies (
            id, adult, backdrop_path, budget, homepage, imdb_id,
            original_language, original_title, overview, popularity,
            poster_path, release_date, revenue, runtime, status,
            tagline, title, video, vote_average, vote_count, published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            adult = VALUES(adult),
            backdrop_path = VALUES(backdrop_path),
            budget = VALUES(budget),
            homepage = VALUES(homepage),
            imdb_id = VALUES(imdb_id),
            original_language = VALUES(original_language),
            original_title = VALUES(original_title),
            overview = VALUES(overview),
            popularity = VALUES(popularity),
            poster_path = VALUES(poster_path),
            release_date = VALUES(release_date),
            revenue = VALUES(revenue),
            runtime = VALUES(runtime),
            status = VALUES(status),
            tagline = VALUES(tagline),
            title = VALUES(title),
            video = VALUES(video),
            vote_average = VALUES(vote_average),
            vote_count = VALUES(vote_count),
            published = VALUES(published)
    `;

        const values = [
            movieData.id,
            movieData.adult || false,
            movieData.backdrop_path || null,
            movieData.budget || 0,
            movieData.homepage || null,
            movieData.imdb_id || null,
            movieData.original_language || null,
            movieData.original_title || null,
            movieData.overview || null,
            movieData.popularity || 0,
            movieData.poster_path || null,
            movieData.release_date ? new Date(movieData.release_date) : null,
            movieData.revenue || 0,
            movieData.runtime || 0,
            movieData.status || null,
            movieData.tagline || null,
            movieData.title || null,
            movieData.video || false,
            movieData.vote_average || 0,
            movieData.vote_count || 0,
            published // <-- динамически вычисленное значение
        ];

        await connection.execute(query, values);
    }

    async insertGenres(genres) {
        const connection = await this.connect();
        for (const genre of genres) {
            const query = `
                INSERT INTO genres (id, name)
                VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE name = VALUES(name)
            `;
            await connection.execute(query, [genre.id, genre.name]);
        }
    }

    async linkMovieGenres(movieId, genres) {
        const connection = await this.connect();
        // Удаляем старые связи
        await connection.execute('DELETE FROM movie_genres WHERE movie_id = ?', [movieId]);

        // Добавляем новые связи
        for (const genre of genres) {
            const query = 'INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)';
            await connection.execute(query, [movieId, genre.id]);
        }
    }

    async insertProductionCompanies(companies) {
        const connection = await this.connect();
        for (const company of companies) {
            const query = `
                INSERT INTO production_companies (id, name, logo_path, origin_country)
                VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                                         name = VALUES(name),
                                         logo_path = VALUES(logo_path),
                                         origin_country = VALUES(origin_country)
            `;
            await connection.execute(query, [
                company.id,
                company.name,
                company.logo_path || null,
                company.origin_country || null
            ]);
        }
    }

    async linkMovieCompanies(movieId, companies) {
        const connection = await this.connect();
        // Удаляем старые связи
        await connection.execute('DELETE FROM movie_production_companies WHERE movie_id = ?', [movieId]);

        // Добавляем новые связи
        for (const company of companies) {
            const query = 'INSERT INTO movie_production_companies (movie_id, company_id) VALUES (?, ?)';
            await connection.execute(query, [movieId, company.id]);
        }
    }

    async insertProductionCountries(countries) {
        const connection = await this.connect();
        for (const country of countries) {
            const query = `
                INSERT INTO production_countries (iso_code, name)
                VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE name = VALUES(name)
            `;
            await connection.execute(query, [country.iso_3166_1, country.name]);
        }
    }

    async linkMovieCountries(movieId, countries) {
        const connection = await this.connect();
        // Удаляем старые связи
        await connection.execute('DELETE FROM movie_production_countries WHERE movie_id = ?', [movieId]);

        // Добавляем новые связи
        for (const country of countries) {
            const query = 'INSERT INTO movie_production_countries (movie_id, country_iso) VALUES (?, ?)';
            await connection.execute(query, [movieId, country.iso_3166_1]);
        }
    }

    async insertSpokenLanguages(languages) {
        const connection = await this.connect();
        for (const language of languages) {
            const query = `
                INSERT INTO spoken_languages (iso_code, name, english_name)
                VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                                         name = VALUES(name),
                                         english_name = VALUES(english_name)
            `;
            await connection.execute(query, [
                language.iso_639_1,
                language.name,
                language.english_name || language.name
            ]);
        }
    }

    async linkMovieLanguages(movieId, languages) {
        const connection = await this.connect();
        // Удаляем старые связи
        await connection.execute('DELETE FROM movie_spoken_languages WHERE movie_id = ?', [movieId]);

        // Добавляем новые связи
        for (const language of languages) {
            const query = 'INSERT INTO movie_spoken_languages (movie_id, language_iso) VALUES (?, ?)';
            await connection.execute(query, [movieId, language.iso_639_1]);
        }
    }

    async getMovieInfo(movieId) {
        try {
            const connection = await this.connect();
            const query = `
                SELECT m.*, 
                       GROUP_CONCAT(DISTINCT g.name) as genres,
                       GROUP_CONCAT(DISTINCT pc.name) as companies,
                       GROUP_CONCAT(DISTINCT pc2.name) as countries,
                       GROUP_CONCAT(DISTINCT sl.name) as languages
                FROM movies m
                LEFT JOIN movie_genres mg ON m.id = mg.movie_id
                LEFT JOIN genres g ON mg.genre_id = g.id
                LEFT JOIN movie_production_companies mpc ON m.id = mpc.movie_id
                LEFT JOIN production_companies pc ON mpc.company_id = pc.id
                LEFT JOIN movie_production_countries mpc2 ON m.id = mpc2.movie_id
                LEFT JOIN production_countries pc2 ON mpc2.country_iso = pc2.iso_code
                LEFT JOIN movie_spoken_languages msl ON m.id = msl.movie_id
                LEFT JOIN spoken_languages sl ON msl.language_iso = sl.iso_code
                WHERE m.id = ?
                GROUP BY m.id
            `;

            const [rows] = await connection.execute(query, [movieId]);

            if (rows.length === 0) {
                return null;
            }

            return rows[0];

        } finally {
            await this.disconnect();
        }
    }

    async deleteMovie(movieId) {
        let connection = null;

        try {
            connection = await this.connect();
            await this.beginTransaction();

            // Удаляем связи (в правильном порядке для избежания нарушений внешних ключей)
            await connection.execute('DELETE FROM movie_spoken_languages WHERE movie_id = ?', [movieId]);
            await connection.execute('DELETE FROM movie_production_countries WHERE movie_id = ?', [movieId]);
            await connection.execute('DELETE FROM movie_production_companies WHERE movie_id = ?', [movieId]);
            await connection.execute('DELETE FROM movie_genres WHERE movie_id = ?', [movieId]);

            // Удаляем основной фильм
            await connection.execute('DELETE FROM movies WHERE id = ?', [movieId]);

            await this.commit();

            return {
                success: true,
                movieId: movieId,
                message: 'Фильм успешно удален'
            };

        } catch (error) {
            if (connection) {
                await this.rollback();
            }
            throw error;

        } finally {
            if (connection) {
                await this.disconnect();
            }
        }
    }
}