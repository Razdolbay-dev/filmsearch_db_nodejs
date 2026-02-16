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
