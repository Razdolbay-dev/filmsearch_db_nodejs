import { generateTMDBExportLinksNative } from '../utils/tmdbLinks.js'
import DownloadService from "../services/downloadService.js";

class TMDBExportController {
    async getURLMoviesFile(req,res) {
        try {
            const links = generateTMDBExportLinksNative();
            const ds = new DownloadService();
            ds.downloadFile(links.movieLink, 'tmdb_downloads')

            res.json({
                success: true,
                message: '`Ссылка на Фильмы',
                link: links.movieLink || 'Ссылка отсутствует'
            });

        } catch (error){
            console.error('Ошибка получения ссылки на файл:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getURLCollectionsFile(req,res) {
        try {
            const links = generateTMDBExportLinksNative();
            const ds = new DownloadService();
            ds.downloadFile(links.collectionLink, 'tmdb_downloads')
            res.json({
                success: true,
                message: '`Ссылка на Фильмы',
                link: links.collectionLink || 'Ссылка отсутствует'
            });

        } catch (error){
            console.error('Ошибка получения ссылки на файл:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getURLTvSeriesFile(req,res) {
        try {
            const links = generateTMDBExportLinksNative();
            console.log(`Ссылка на Фильмы: ${links.tvSeriesLink}`);
            const ds = new DownloadService();
            ds.downloadFile(links.tvSeriesLink, 'tmdb_downloads')
            res.json({
                success: true,
                message: '`Ссылка на Фильмы',
                link: links.tvSeriesLink || 'Ссылка отсутствует'
            });

        } catch (error){
            console.error('Ошибка получения ссылки на файл:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getAllURLs(req,res) {
        try {
            const links = generateTMDBExportLinksNative();

            const ds = new DownloadService();
            ds.downloadFile(links.movieLink, 'tmdb_downloads')
            ds.downloadFile(links.collectionLink, 'tmdb_downloads')
            ds.downloadFile(links.tvSeriesLink, 'tmdb_downloads')

            res.json({
                links
            });

        } catch (error){
            console.error('Ошибка получения ссылки на файл:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
export default new TMDBExportController();