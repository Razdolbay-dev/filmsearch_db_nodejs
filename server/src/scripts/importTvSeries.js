#!/usr/bin/env node

import { ApiService } from '../services/ApiService.js';
import { DataProcessor } from '../services/DataProcessor.js';
import { Logger } from '../utils/logger.js';
import { config } from 'dotenv';

config();

async function importTvSeries(seriesId) {
    try {
        Logger.info(`Starting import for TV series ID: ${seriesId}`);

        const apiService = new ApiService();
        const dataProcessor = new DataProcessor();

        // 1. Получаем данные из API
        const seriesData = await apiService.fetchTvSeries(seriesId);

        if (!seriesData.success) {
            throw new Error(`API returned unsuccessful response for TV series ${seriesId}`);
        }

        // 2. Обрабатываем и сохраняем данные
        const result = await dataProcessor.processTvSeriesData(seriesData);

        if (result.success) {
            Logger.info(`Successfully imported TV series ${seriesId}`);
            return result;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        Logger.error(`Failed to import TV series ${seriesId}:`, error);
        throw error;
    }
}

async function importMultipleTvSeries(seriesIds) {
    const results = [];
    for (const seriesId of seriesIds) {
        try {
            Logger.info(`Processing TV series ${seriesId} (${results.length + 1}/${seriesIds.length})`);
            const result = await importTvSeries(seriesId);
            results.push({ seriesId, success: true, ...result });
        } catch (error) {
            results.push({ seriesId, success: false, error: error.message });
        }
    }

    // Отчет
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    Logger.info(`Import completed: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
        Logger.info('Failed imports:');
        results.filter(r => !r.success).forEach(r => {
            Logger.info(`  TV series ${r.seriesId}: ${r.error}`);
        });
    }

    return results;
}

// Основная функция
async function main() {
    try {
        const args = process.argv.slice(2);

        if (args.length === 0) {
            console.log('Usage: node importTvSeries.js <seriesId> [<seriesId2> ...]');
            console.log('Example: node importTvSeries.js 87108');
            console.log('Example: node importTvSeries.js 87108 66732 1396');
            process.exit(1);
        }

        const seriesIds = args.map(id => parseInt(id)).filter(id => !isNaN(id));

        if (seriesIds.length === 1) {
            await importTvSeries(seriesIds[0]);
        } else {
            await importMultipleTvSeries(seriesIds);
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

export { importTvSeries, importMultipleTvSeries };