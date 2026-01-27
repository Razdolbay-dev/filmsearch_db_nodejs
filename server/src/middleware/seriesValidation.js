/**
 * Middleware для валидации ID сериала
 */
export const validateSeriesId = (req, res, next) => {
    const { id } = req.params;

    if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({
            success: false,
            error: 'Некорректный ID сериала. Должен быть числом.',
            received: id
        });
    }

    next();
};

/**
 * Middleware для валидации номера сезона
 */
export const validateSeasonNumber = (req, res, next) => {
    const { seasonNumber } = req.params;

    if (!seasonNumber || !/^\d+$/.test(seasonNumber)) {
        return res.status(400).json({
            success: false,
            error: 'Некорректный номер сезона. Должен быть числом.',
            received: seasonNumber,
            example: '1, 2, 3...'
        });
    }

    next();
};

/**
 * Middleware для валидации номера эпизода
 */
export const validateEpisodeNumber = (req, res, next) => {
    const { episodeNumber } = req.params;

    if (!episodeNumber || !/^\d+$/.test(episodeNumber)) {
        return res.status(400).json({
            success: false,
            error: 'Некорректный номер эпизода. Должен быть числом.',
            received: episodeNumber,
            example: '1, 2, 3...'
        });
    }

    next();
};