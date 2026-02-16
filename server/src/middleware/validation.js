/**
 * Middleware для валидации ID фильма
 */
export const validateMovieId = (req, res, next) => {
    const { id } = req.params;

    // Проверяем что ID это число
    if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({
            success: false,
            error: 'Некорректный ID фильма. Должен быть числом.',
            received: id
        });
    }

    next();
};

/**
 * Middleware для валидации языка
 */
export const validateLanguage = (req, res, next) => {
    const { language = 'ru-RU' } = req.query;

    // Простая проверка формата языка
    const languageRegex = /^[a-z]{2}-[A-Z]{2}$/;
    if (!languageRegex.test(language)) {
        return res.status(400).json({
            success: false,
            error: 'Некорректный формат языка. Используйте формат "xx-XX".',
            received: language,
            example: 'ru-RU, en-US'
        });
    }

    next();
};