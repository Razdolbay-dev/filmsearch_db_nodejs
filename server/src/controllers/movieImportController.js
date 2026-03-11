import {MovieImportService} from '../services/movieImportService.js';

const movieImportService = new MovieImportService();

export class MovieImportController {
    async getMovieInfo(req, res) {
        try {
            const movieId = parseInt(req.params.id);
            console.log(`Запрошен фильм с id : ${movieId}`)
            const movieInfo = await movieImportService.getMovieInfo(movieId);

            if (movieInfo) {
                res.json(movieInfo);
            } else {
                res.status(404).json({ error: 'Фильм не найден' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async postMovieInfo(req,res){
        try {
            const movieId = parseInt(req.params.id);
            const result = await movieImportService.fetchAndStoreMovie(movieId);

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