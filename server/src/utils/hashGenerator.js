// utils/hashGenerator.js

/**
 * Генерирует детерминированный ID для эпизода на основе seriesId, seasonNumber и episodeNumber
 * Использует алгоритм djb2 (хорошее распределение, быстро)
 */
export function generateEpisodeId(seriesId, seasonNumber, episodeNumber) {
    const str = `${seriesId}-${seasonNumber}-${episodeNumber}`;
    let hash = 5381; // Начальное значение

    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
        hash = hash & hash; // Конвертируем в 32-битное число
    }

    // Берем абсолютное значение и ограничиваем максимальным INT (2,147,483,647)
    return Math.abs(hash) % 2147483647;
}

/**
 * Альтернативная функция с использованием FNV-1a хеша
 * Еще лучше распределение, но чуть медленнее
 */
export function generateEpisodeIdFNV(seriesId, seasonNumber, episodeNumber) {
    const str = `${seriesId}-${seasonNumber}-${episodeNumber}`;
    let hash = 2166136261; // FNV offset basis

    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash *= 16777619; // FNV prime
        hash = hash & hash; // 32-битное ограничение
    }

    return Math.abs(hash) % 2147483647;
}

/**
 * Функция для обратной совместимости и проверки коллизий
 */
export function validateEpisodeId(connection, seriesId, seasonNumber, episodeNumber, generatedId) {
    return new Promise(async (resolve) => {
        try {
            const [existing] = await connection.query(
                `SELECT id, series_id, season_number, episode_number 
                 FROM tv_episodes WHERE id = ?`,
                [generatedId]
            );

            if (existing.length === 0) {
                // ID свободен
                resolve(generatedId);
                return;
            }

            // Проверяем, не коллизия ли это
            const existingEpisode = existing[0];
            if (existingEpisode.series_id === seriesId &&
                existingEpisode.season_number === seasonNumber &&
                existingEpisode.episode_number === episodeNumber) {
                // Это тот же эпизод - всё ок
                resolve(generatedId);
                return;
            }

            // Коллизия! Разные эпизоды дали одинаковый ID
            console.warn(`⚠️ Коллизия ID для разных эпизодов!`, {
                generatedId,
                existingEpisode: `${existingEpisode.series_id}-${existingEpisode.season_number}-${existingEpisode.episode_number}`,
                newEpisode: `${seriesId}-${seasonNumber}-${episodeNumber}`
            });

            // Генерируем запасной ID с дополнительным seed
            const fallbackId = generateEpisodeIdFallback(seriesId, seasonNumber, episodeNumber);
            console.log(`   Использую запасной ID: ${fallbackId}`);

            // Рекурсивно проверяем запасной ID
            resolve(await validateEpisodeId(connection, seriesId, seasonNumber, episodeNumber, fallbackId));

        } catch (error) {
            console.error('Ошибка при валидации ID:', error);
            resolve(generatedId); // В случае ошибки используем оригинальный ID
        }
    });
}

/**
 * Запасная функция генерации на случай коллизий
 */
function generateEpisodeIdFallback(seriesId, seasonNumber, episodeNumber, attempt = 1) {
    // Добавляем attempt к строке для уникальности
    const str = `${seriesId}-${seasonNumber}-${episodeNumber}-${attempt}`;
    let hash = 5381;

    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash;
    }

    return Math.abs(hash) % 2147483647;
}

/**
 * Пакетная генерация ID для всех эпизодов сезона
 */
export function generateSeasonEpisodeIds(seriesId, seasonNumber, episodes) {
    return episodes.map(episode => ({
        ...episode,
        generatedId: generateEpisodeId(seriesId, seasonNumber, episode.episode_number)
    }));
}

/**
 * Тестирование коллизий
 */
export function testCollisions(seriesId, maxSeasons = 10, maxEpisodes = 24) {
    const ids = new Map();
    const collisions = [];

    console.log(`🧪 Тестирование генерации ID для сериала ${seriesId}:`);
    console.log(`   Сезонов: ${maxSeasons}, Эпизодов в сезоне: ${maxEpisodes}`);

    for (let s = 1; s <= maxSeasons; s++) {
        for (let e = 1; e <= maxEpisodes; e++) {
            const id = generateEpisodeId(seriesId, s, e);
            const key = `${s}-${e}`;

            if (ids.has(id)) {
                const existing = ids.get(id);
                collisions.push({
                    id,
                    existing: existing,
                    current: key,
                    existingKey: existing
                });
            } else {
                ids.set(id, key);
            }
        }
    }

    console.log(`   ✅ Уникальных ID: ${ids.size}`);
    console.log(`   ❌ Коллизий: ${collisions.length}`);

    if (collisions.length > 0) {
        console.log('   Примеры коллизий:');
        collisions.slice(0, 5).forEach(c => {
            console.log(`      ID ${c.id}: сезон ${c.current} конфликтует с сезоном ${c.existingKey}`);
        });
    }

    return { unique: ids.size, collisions: collisions.length };
}