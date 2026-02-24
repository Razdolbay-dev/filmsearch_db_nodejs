import MoviesService from '../services/moviesService.js';

class MoviesController {
    constructor() {
        this.moviesService = new MoviesService();
    }

    getAllMovies = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await this.moviesService.getAllMovies(page, limit);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getAllMovies:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    getMovieById = async (req, res) => {
        try {
            const { id } = req.params;

            const movie = await this.moviesService.getMovieById(id);

            if (!movie) {
                return res.status(404).json({
                    success: false,
                    error: 'Movie not found'
                });
            }

            res.json({
                success: true,
                data: movie
            });
        } catch (error) {
            console.error('Error in getMovieById:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    searchMovies = async (req, res) => {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }

            const result = await this.moviesService.searchMovies(q, page, limit);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in searchMovies:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    getMoviesByGenre = async (req, res) => {
        try {
            const { genreId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await this.moviesService.getMoviesByGenre(genreId, page, limit);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getMoviesByGenre:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    getPopularMovies = async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;

            const movies = await this.moviesService.getPopularMovies(limit);

            res.json({
                success: true,
                data: movies
            });
        } catch (error) {
            console.error('Error in getPopularMovies:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    getMoviesByYear = async (req, res) => {
        try {
            const { year } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await this.moviesService.getMoviesByYear(year, page, limit);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getMoviesByYear:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
}

export default MoviesController;