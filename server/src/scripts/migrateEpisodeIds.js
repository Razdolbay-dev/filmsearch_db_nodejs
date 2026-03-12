// scripts/migrateEpisodeIds.js
import { pool } from '../config/database.js';
import { generateEpisodeId } from '../utils/hashGenerator.js';

async function migrateEpisodeIds() {
    const connection = await pool.getConnection();

    try {
        console.log('🔄 Начинаем миграцию ID эпизодов...');

        // Получаем все эпизоды
        const [episodes] = await connection.query(`
            SELECT id, series_id, season_number, episode_number 
            FROM tv_episodes
        `);

        console.log(`📊 Найдено эпизодов: ${episodes.length}`);

        let updated = 0;
        let conflicts = 0;

        for (const episode of episodes) {
            // Генерируем новый ID по новой системе
            const newId = generateEpisodeId(
                episode.series_id,
                episode.season_number,
                episode.episode_number
            );

            // Если ID совпадает со старым - пропускаем
            if (newId === episode.id) {
                console.log(`✓ Эпизод ${episode.id} уже имеет корректный ID`);
                continue;
            }

            // Проверяем, не занят ли новый ID
            const [existing] = await connection.query(
                'SELECT id FROM tv_episodes WHERE id = ? AND id != ?',
                [newId, episode.id]
            );

            if (existing.length > 0) {
                console.warn(`⚠️ Конфликт: ID ${newId} уже занят другим эпизодом`);
                conflicts++;
                continue;
            }

            // Обновляем ID эпизода
            await connection.query(
                `UPDATE tv_episodes SET id = ? WHERE id = ?`,
                [newId, episode.id]
            );

            // Обновляем связанные таблицы (если есть)
            // Например, если есть таблицы с внешними ключами на episodes
            // await connection.query(
            //     'UPDATE some_related_table SET episode_id = ? WHERE episode_id = ?',
            //     [newId, episode.id]
            // );

            updated++;

            if (updated % 100 === 0) {
                console.log(`   Прогресс: ${updated}/${episodes.length} эпизодов`);
            }
        }

        console.log(`\n✅ Миграция завершена:`);
        console.log(`   Обновлено эпизодов: ${updated}`);
        console.log(`   Конфликтов: ${conflicts}`);
        console.log(`   Пропущено: ${episodes.length - updated - conflicts}`);

    } catch (error) {
        console.error('❌ Ошибка миграции:', error);
    } finally {
        connection.release();
    }
}

// Запуск миграции
migrateEpisodeIds().then(() => {
    console.log('🏁 Скрипт завершен');
    process.exit(0);
});