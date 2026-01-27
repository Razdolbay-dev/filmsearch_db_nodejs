// Альтернативная версия без date-fns (если не хотите устанавливать библиотеку)
function generateTMDBExportLinksNative() {
    const now = new Date();

    // Проверяем, сейчас раньше 13:00?
    const isBefore1PM = now.getHours() < 13;

    // Определяем дату для экспорта
    const exportDate = new Date(now);
    if (isBefore1PM) {
        exportDate.setDate(exportDate.getDate() - 1);
    }

    // Получаем компоненты даты
    const month = String(exportDate.getMonth() + 1).padStart(2, '0');
    const day = String(exportDate.getDate()).padStart(2, '0');
    const year = exportDate.getFullYear();

    const dateString = `${month}_${day}_${year}`;

    return {
        date: `${year}-${month}-${day}`,
        movieLink: `http://files.tmdb.org/p/exports/movie_ids_${dateString}.json.gz`,
        tvSeriesLink: `http://files.tmdb.org/p/exports/tv_series_ids_${dateString}.json.gz`,
        collectionLink: `http://files.tmdb.org/p/exports/collection_ids_${dateString}.json.gz`
    };
}

export {generateTMDBExportLinksNative};