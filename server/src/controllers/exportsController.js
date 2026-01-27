import { generateTMDBExportLinksNative } from '../utils/tmdbLinks.js'
import DownloadService from "../services/downloadService.js";
import {getExportDate, formatDateToMM_DD_YYYY, TMDBImportManager} from "../models/tmdbImportManager.js";

const links = generateTMDBExportLinksNative();
const ds = new DownloadService();
const importData = new TMDBImportManager();

class TMDBExportController {
    async getURLMoviesFile(req,res) {
        try {
            const filePath = `tmdb_downloads/${ds.extractFileNameFromUrl(links.movieLink)}`

            console.log(`API: Импорт данных TMDB за ${links.date}`);

            await ds.downloadFile(links.movieLink, 'tmdb_downloads')
            await importData.importMovies(filePath, links.date)

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
            const filePath = `tmdb_downloads/${ds.extractFileNameFromUrl(links.collectionLink)}`

            await ds.downloadFile(links.collectionLink, 'tmdb_downloads')
            await importData.importMovies(filePath, links.date)

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
            const filePath = `tmdb_downloads/${ds.extractFileNameFromUrl(links.tvSeriesLink)}`

            await ds.downloadFile(links.tvSeriesLink, 'tmdb_downloads')
            await importData.importMovies(filePath, links.date)

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
            const filesToDownload = [
                { url: links.movieLink, type: 'movie' },
                { url: links.collectionLink, type: 'collection' },
                { url: links.tvSeriesLink, type: 'tv_series' }
            ];

            for (const file of filesToDownload) {
                await ds.downloadFile(file.url, 'tmdb_downloads');
                console.log(`✅ Скачан файл: ${file.type}`);
            }

            const dateExport = getExportDate().replace(/-/g,'_');

            console.log(`ДАТА : ${formatDateToMM_DD_YYYY(dateExport)}`)

            importData.importAllExports(formatDateToMM_DD_YYYY(dateExport), `tmdb_downloads`);

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