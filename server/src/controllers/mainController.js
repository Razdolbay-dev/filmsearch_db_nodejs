// controllers/contentController.js
import { excludeContent } from '../services/mainService.js';

/**
 * Контроллер для исключения фильма
 * POST /api/<content>/exclude/:id
 * Body: { "media_type": "movie" } или { "media_type": "series" }
 */
export async function excludeContentController(req, res) {
    try {
        // Получаем ID из параметров URL
        const id = parseInt(req.params.id);

        // Получаем media_type из тела запроса
        const { media_type } = req.body;

        // Валидация
        if (!media_type) {
            return res.status(400).json({
                success: false,
                message: 'Не указан media_type в теле запроса'
            });
        }

        // Вызываем функцию исключения
        const result = await excludeContent(id, media_type);

        // Отправляем ответ с соответствующим HTTP статусом
        if (result.success) {
            return res.status(200).json(result);
        } else {
            // Если контент уже в исключениях - 409 Conflict
            if (result.message.includes('уже в списке исключений')) {
                return res.status(409).json(result);
            }
            // Остальные ошибки - 400 Bad Request
            return res.status(400).json(result);
        }

    } catch (error) {
        console.error('Ошибка в контроллере excludeMovie:', error);
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
}