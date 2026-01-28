import { ApiService } from '../services/ApiService.js';
import { DataProcessor } from '../services/DataProcessor.js';
import { Logger } from '../utils/logger.js';
import { config } from 'dotenv';

config();

async function importMovie(movieId) {
    try {
        Logger.info(`Starting import for movie ID: ${movieId}`);

        const apiService = new ApiService();
        const dataProcessor = new DataProcessor();

        // 1. Получаем данные из API
        const movieData = await apiService.fetchMovie(movieId);

        if (!movieData.success) {
            throw new Error(`API returned unsuccessful response for movie ${movieId}`);
        }

        // 2. Обрабатываем и сохраняем данные
        const result = await dataProcessor.processMovieData(movieData);

        if (result.success) {
            Logger.info(`Successfully imported movie ${movieId}`);
            return result;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        Logger.error(`Failed to import movie ${movieId}:`, error);
        throw error;
    }
}

async function importMultipleMovies(movieIds) {
    const results = [];
    for (const movieId of movieIds) {
        try {
            Logger.info(`Processing movie ${movieId} (${results.length + 1}/${movieIds.length})`);
            const result = await importMovie(movieId);
            results.push({ movieId, success: true, ...result });
        } catch (error) {
            results.push({ movieId, success: false, error: error.message });
        }
    }

    // Отчет
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    Logger.info(`Import completed: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
        Logger.info('Failed imports:');
        results.filter(r => !r.success).forEach(r => {
            Logger.info(`  Movie ${r.movieId}: ${r.error}`);
        });
    }

    return results;
}

// Основная функция
async function main() {
    try {
        const args = process.argv.slice(2);

        if (args.length === 0) {
            console.log('Usage: node importMovie.js <movieId> [<movieId2> ...]');
            console.log('Example: node importMovie.js 550');
            console.log('Example: node importMovie.js 550 551 552');
            process.exit(1);
        }

        const movieIds = args.map(id => parseInt(id)).filter(id => !isNaN(id));

        if (movieIds.length === 1) {
            await importMovie(movieIds[0]);
        } else {
            await importMultipleMovies(movieIds);
        }

        process.exit(0);
    } catch (error) {
        Logger.error('Fatal error:', error);
        process.exit(1);
    }
}

// Запуск
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { importMovie, importMultipleMovies };