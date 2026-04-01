import * as searchService from '../services/searchService.js';

/**
 * Простой поиск контента с пагинацией
 */
export async function searchContent(req, res) {
    try {
        const {
            q,
            page = 1,
            limit = 20
        } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Поисковый запрос обязателен'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Валидация параметров пагинации
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный номер страницы. Должен быть положительным числом'
            });
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный лимит. Должен быть от 1 до 100'
            });
        }

        const result = await searchService.searchContent(q, pageNum, limitNum);

        res.json({
            success: true,
            data: result.data,
            metadata: result.metadata,
            query: q
        });

    } catch (error) {
        console.error('Ошибка в searchContent контроллере:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Внутренняя ошибка сервера'
        });
    }
}

/**
 * Расширенный поиск с фильтрами и пагинацией
 */
export async function advancedSearch(req, res) {
    try {
        const {
            q,
            type = 'all',
            limit = 20,
            page = 1,
            sortBy = 'popularity',
            sortOrder = 'DESC',
            yearFrom,
            yearTo,
            minVoteAverage
        } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Поисковый запрос обязателен'
            });
        }

        // Валидация параметров
        const validTypes = ['all', 'movie', 'series'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный тип параметра. Допустимо: all, movie или series'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный номер страницы'
            });
        }

        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный лимит. Должен быть от 1 до 100'
            });
        }

        const results = await searchService.advancedSearch({
            query: q,
            type,
            limit: limitNum,
            page: pageNum,
            sortBy,
            sortOrder,
            yearFrom: yearFrom ? parseInt(yearFrom) : null,
            yearTo: yearTo ? parseInt(yearTo) : null,
            minVoteAverage: minVoteAverage ? parseFloat(minVoteAverage) : null
        });

        res.json({
            success: true,
            data: results,
            query: q,
            params: {
                type,
                limit: limitNum,
                page: pageNum,
                sortBy,
                sortOrder
            }
        });

    } catch (error) {
        console.error('Ошибка в advancedSearch контроллере:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Внутренняя ошибка сервера'
        });
    }
}

/**
 * Поиск с авто-дополнением
 */
export async function searchSuggestions(req, res) {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const limitNum = parseInt(limit);
        const suggestions = await searchService.searchSuggestions(q, limitNum > 0 ? limitNum : 10);

        res.json({
            success: true,
            data: suggestions
        });

    } catch (error) {
        console.error('Ошибка в searchSuggestions контроллере:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Внутренняя ошибка сервера'
        });
    }
}

/**
 * Получение детальной информации о контенте
 */
export async function getContentDetails(req, res) {
    try {
        const { id, type } = req.params;

        if (!id || !type) {
            return res.status(400).json({
                success: false,
                error: 'ID и тип контента обязательны'
            });
        }

        const contentId = parseInt(id);
        if (isNaN(contentId) || contentId <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID'
            });
        }

        const details = await searchService.getContentDetails(contentId, type);

        if (!details) {
            return res.status(404).json({
                success: false,
                error: 'Контент не найден'
            });
        }

        res.json({
            success: true,
            data: details
        });

    } catch (error) {
        console.error('Ошибка в getContentDetails контроллере:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Внутренняя ошибка сервера'
        });
    }
}