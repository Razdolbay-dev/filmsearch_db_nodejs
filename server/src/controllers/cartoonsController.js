import CartoonsService from '../services/cartoonsService.js';

class CartoonsController {
    constructor() {
        this.cartoonsService = new CartoonsService();
    }

    getAllCartoons = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            // Получаем тип из query параметров, по умолчанию 'all'
            const type = req.query.type || 'all';

            console.log(`📌 CartoonsController: запрос с параметрами:`, {
                page,
                limit,
                type,
                query: req.query
            });

            const result = await this.cartoonsService.getAllCartoons(page, limit, type);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getAllCartoons:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    getPopularCartoons = async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;

            const cartoons = await this.cartoonsService.getPopularCartoons(limit);

            res.json({
                success: true,
                data: cartoons
            });
        } catch (error) {
            console.error('Error in getPopularCartoons:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    getCartoonById = async (req, res) => {
        try {
            const { id } = req.params;

            const cartoon = await this.cartoonsService.getCartoonById(id);

            if (!cartoon) {
                return res.status(404).json({
                    success: false,
                    error: 'Cartoon not found'
                });
            }

            res.json({
                success: true,
                data: cartoon
            });
        } catch (error) {
            console.error('Error in getCartoonById:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    searchCartoons = async (req, res) => {
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

            const result = await this.cartoonsService.searchCartoons(q, page, limit);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in searchCartoons:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    getCartoonsByYear = async (req, res) => {
        try {
            const { year } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await this.cartoonsService.getCartoonsByYear(year, page, limit);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getCartoonsByYear:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
}

export default CartoonsController;