#!/usr/bin/env node

import { importMultipleMovies } from './importMovie.js';
import { importMultipleTvSeries } from './importTvSeries.js';
import { Logger } from '../utils/logger.js';
import { config } from 'dotenv';

config();

async function importAll() {
    try {
        const args = process.argv.slice(2);

        if (args.length < 2) {
            console.log('Usage: node importAll.js <movieIds> <seriesIds>');
            console.log('Example: node importAll.js "550,551" "87108,66732"');
            console.log('Note: IDs should be comma-separated');
            process.exit(1);
        }

        const movieIds = args[0].split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        const seriesIds = args[1].split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

        Logger.info(`Importing ${movieIds.length} movies and ${seriesIds.length} TV series`);

        // Импортируем фильмы
        if (movieIds.length > 0) {
            Logger.info('Starting movie imports...');
            await importMultipleMovies(movieIds);
        }

        // Импортируем сериалы
        if (seriesIds.length > 0) {
            Logger.info('Starting TV series imports...');
            await importMultipleTvSeries(seriesIds);
        }

        Logger.info('All imports completed successfully!');
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