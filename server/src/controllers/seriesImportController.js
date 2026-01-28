// В вашем основном файле
import { SeriesImportService } from '../services/seriesImportService.js';

const seriesImport = new SeriesImportService();

export class SeriesImportController {
    async postSeriesInfo(req,res){
        try {
            const seriesId = parseInt(req.params.id);
            const result = await seriesImport.importSeriesById(seriesId);
            console.log(result)

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}




/**
// Импорт одного сериала
try {
    await seriesService.importSeriesById(76946);
    console.log('Импорт завершен успешно');
} catch (error) {
    console.error('Ошибка импорта:', error);
}

// Импорт нескольких сериалов
const seriesIds = [76946, 12345, 67890];
const results = await seriesService.importMultipleSeries(seriesIds);
console.log(`Успешно: ${results.successful.length}, Ошибки: ${results.failed.length}`);
 */