import path from 'path';

export class TorrentParser {
    /**
     * Паттерны для определения сезонов
     */
    static SEASON_PATTERNS = [
        /season\s*(\d+)/i,
        /сезон\s*(\d+)/i,
        /s(\d+)/i,
        /第(\d+)季/i,
        /saison\s*(\d+)/i,
        /temporada\s*(\d+)/i,
    ];

    /**
     * Паттерны для определения серий
     */
    static EPISODE_PATTERNS = [
        /e(\d+)/i,
        /episode\s*(\d+)/i,
        /серия\s*(\d+)/i,
        /ep\.?\s*(\d+)/i,
        /series?\s*(\d+)/i,
        /第(\d+)话/i,
        /第(\d+)集/i,
        /(\d+)\s*series/i,
        /[\s\._-](\d{1,2})(?=[\s\._-]|$)/, // Простое число в конце или между разделителями
    ];

    /**
     * Паттерны для специальных файлов (не серии)
     */
    static SPECIAL_FILES_PATTERNS = [
        /trailer/i,
        /sample/i,
        /extra/i,
        /feature/i,
        /bonus/i,
        /menu/i,
        /credit/i,
        /opening/i,
        /ending/i,
        /ncop/i,
        /nced/i,
    ];

    /**
     * Основной метод парсинга торрента из ответа TorrServer
     */
    static parseTorrent(torrentData) {
        // Извлекаем файлы из поля data
        const fileStats = this.extractFileStats(torrentData);

        if (!fileStats || fileStats.length === 0) {
            return this.createEmptyStructure(torrentData);
        }

        // Добавляем file_stats в объект для дальнейшего парсинга
        const enrichedTorrentData = {
            ...torrentData,
            file_stats: fileStats,
        };

        // Определяем тип структуры
        const structureType = this.detectStructureType(fileStats);

        // Парсим файлы в зависимости от типа
        let parsedData;
        switch (structureType) {
            case 'tv_series':
                parsedData = this.parseTVSeries(enrichedTorrentData);
                break;
            case 'movies_collection':
                parsedData = this.parseMoviesCollection(enrichedTorrentData);
                break;
            case 'single_movie':
                parsedData = this.parseSingleMovie(enrichedTorrentData);
                break;
            case 'anime_series':
                parsedData = this.parseAnimeSeries(enrichedTorrentData);
                break;
            default:
                parsedData = this.parseGeneric(enrichedTorrentData);
        }

        // Добавляем метаданные торрента
        return {
            ...parsedData,
            torrentInfo: {
                hash: torrentData.hash,
                name: torrentData.name || torrentData.title,
                title: torrentData.title,
                totalSize: torrentData.torrent_size,
                status: torrentData.stat_string,
                addedTime: torrentData.timestamp,
                category: torrentData.category,
                poster: torrentData.poster,
            },
        };
    }

    /**
     * Извлекает список файлов из поля data ответа TorrServer
     */
    static extractFileStats(torrentData) {
        if (!torrentData.data) {
            return null;
        }

        try {
            // Парсим строку data как JSON
            const parsedData = typeof torrentData.data === 'string'
                ? JSON.parse(torrentData.data)
                : torrentData.data;

            // Извлекаем файлы из структуры TorrServer.Files
            if (parsedData && parsedData.TorrServer && parsedData.TorrServer.Files) {
                return parsedData.TorrServer.Files;
            }

            return null;
        } catch (error) {
            console.error('Error parsing torrent data:', error.message);
            return null;
        }
    }

    /**
     * Определить тип структуры торрента
     */
    static detectStructureType(fileStats) {
        const paths = fileStats.map(f => f.path);
        const hasNestedFolders = paths.some(p => p.includes('/') && p.split('/').length > 2);
        const episodeCount = this.countEpisodes(paths);
        const seasonFolders = this.findSeasonFolders(paths);
        const isAnime = paths.some(p => /\[VCB-Studio\]|\[Anime\]|\[BDrip\]|x265/i.test(p));
        const avgFileSize = fileStats.reduce((sum, f) => sum + f.length, 0) / fileStats.length;
        const isMovieSize = avgFileSize > 1_000_000_000; // > 1GB average suggests movies

        if (seasonFolders.length > 1 || episodeCount > 12) {
            return isAnime ? 'anime_series' : 'tv_series';
        }

        if (hasNestedFolders && episodeCount <= 5 && isMovieSize) {
            return 'movies_collection';
        }

        if (episodeCount === 1 && fileStats.length === 1) {
            return 'single_movie';
        }

        // Если есть S01/S02 папки но мало эпизодов - возможно аниме
        if (isAnime && seasonFolders.length > 0) {
            return 'anime_series';
        }

        return 'generic';
    }

    /**
     * Парсинг TV сериала
     */
    static parseTVSeries(torrentData) {
        const seasons = new Map();
        const specialFiles = [];

        for (const file of torrentData.file_stats) {
            const parsed = this.parseFilePath(file.path, file.id, file.length);

            if (parsed.isSpecial) {
                specialFiles.push({
                    ...parsed,
                    streamUrl: this.buildStreamUrl(torrentData.hash, file.id, file.path),
                });
                continue;
            }

            if (parsed.season !== null && parsed.episode !== null) {
                if (!seasons.has(parsed.season)) {
                    seasons.set(parsed.season, {
                        seasonNumber: parsed.season,
                        episodes: [],
                        title: this.getSeasonTitle(parsed.season),
                        path: this.getSeasonPath(torrentData.file_stats, parsed.season),
                    });
                }

                seasons.get(parsed.season).episodes.push({
                    id: file.id,
                    number: parsed.episode,
                    title: parsed.title || this.extractEpisodeTitle(file.path),
                    path: file.path,
                    size: file.length,
                    streamUrl: this.buildStreamUrl(torrentData.hash, file.id, file.path),
                });
            }
        }

        // Сортируем сезоны и серии
        const sortedSeasons = Array.from(seasons.values())
            .map(season => ({
                ...season,
                episodes: season.episodes.sort((a, b) => a.number - b.number),
            }))
            .sort((a, b) => a.seasonNumber - b.seasonNumber);

        return {
            type: 'tv_series',
            seasons: sortedSeasons,
            specialFiles: specialFiles,
            totalEpisodes: sortedSeasons.reduce((sum, s) => sum + s.episodes.length, 0),
            totalSize: torrentData.torrent_size,
        };
    }

    /**
     * Парсинг коллекции фильмов
     */
    static parseMoviesCollection(torrentData) {
        const movies = [];

        for (const file of torrentData.file_stats) {
            const parsed = this.parseFilePath(file.path, file.id, file.length);
            const folderName = this.getParentFolderName(file.path);

            movies.push({
                id: file.id,
                title: parsed.title || this.extractMovieTitle(file.path),
                folder: folderName,
                path: file.path,
                size: file.length,
                streamUrl: this.buildStreamUrl(torrentData.hash, file.id, file.path),
                quality: this.extractQuality(file.path),
                resolution: this.extractResolution(file.path),
            });
        }

        return {
            type: 'movies_collection',
            movies: movies.sort((a, b) => a.title.localeCompare(b.title)),
            totalMovies: movies.length,
            totalSize: torrentData.torrent_size,
        };
    }

    /**
     * Парсинг аниме (особая структура с группами релизеров)
     */
    static parseAnimeSeries(torrentData) {
        const seasons = new Map();

        for (const file of torrentData.file_stats) {
            const parsed = this.parseFilePath(file.path, file.id, file.length);

            // Аниме часто имеет формат: [Release Group] Title S01E01.mkv
            const animeMatch = file.path.match(/\[([^\]]+)\]\s*([^\/]+?)\s*(?:S(\d+))?E(\d+)/i);

            let season = parsed.season;
            let episode = parsed.episode;

            if (animeMatch && (season === null || episode === null)) {
                season = season !== null ? season : (animeMatch[3] ? parseInt(animeMatch[3]) : 1);
                episode = episode !== null ? episode : parseInt(animeMatch[4]);
            }

            // Fallback: пробуем найти сезон в названии папки
            if (season === null) {
                const pathParts = file.path.split('/');
                for (const part of pathParts) {
                    const seasonMatch = part.match(/S(\d+)/i);
                    if (seasonMatch) {
                        season = parseInt(seasonMatch[1]);
                        break;
                    }
                }
            }

            // Fallback: пробуем найти эпизод в имени файла по простому числу
            if (episode === null && !parsed.isSpecial) {
                const fileName = path.basename(file.path);
                const numberMatch = fileName.match(/\b(\d{1,2})\b/);
                if (numberMatch) {
                    episode = parseInt(numberMatch[1]);
                }
            }

            if (season !== null && episode !== null && !parsed.isSpecial) {
                if (!seasons.has(season)) {
                    seasons.set(season, {
                        seasonNumber: season,
                        episodes: [],
                        title: this.getSeasonTitle(season),
                        releaseGroup: animeMatch ? animeMatch[1] : null,
                    });
                }

                seasons.get(season).episodes.push({
                    id: file.id,
                    number: episode,
                    title: parsed.title || this.extractTitle(file.path),
                    path: file.path,
                    size: file.length,
                    streamUrl: this.buildStreamUrl(torrentData.hash, file.id, file.path),
                });
            } else if (!parsed.isSpecial) {
                // Если не удалось определить сезон и серию, добавляем как отдельный файл
                if (!seasons.has(0)) {
                    seasons.set(0, {
                        seasonNumber: 0,
                        title: 'Specials',
                        episodes: [],
                    });
                }
                seasons.get(0).episodes.push({
                    id: file.id,
                    number: seasons.get(0).episodes.length + 1,
                    title: parsed.title || path.basename(file.path),
                    path: file.path,
                    size: file.length,
                    streamUrl: this.buildStreamUrl(torrentData.hash, file.id, file.path),
                });
            }
        }

        const sortedSeasons = Array.from(seasons.values())
            .map(season => ({
                ...season,
                episodes: season.episodes.sort((a, b) => a.number - b.number),
            }))
            .sort((a, b) => a.seasonNumber - b.seasonNumber);

        return {
            type: 'anime_series',
            seasons: sortedSeasons,
            totalEpisodes: sortedSeasons.reduce((sum, s) => sum + s.episodes.length, 0),
            totalSize: torrentData.torrent_size,
        };
    }

    /**
     * Парсинг одиночного фильма
     */
    static parseSingleMovie(torrentData) {
        const file = torrentData.file_stats[0];
        const parsed = this.parseFilePath(file.path, file.id, file.length);

        return {
            type: 'movie',
            movie: {
                id: file.id,
                title: parsed.title || this.extractMovieTitle(file.path),
                path: file.path,
                size: file.length,
                streamUrl: this.buildStreamUrl(torrentData.hash, file.id, file.path),
                quality: this.extractQuality(file.path),
                resolution: this.extractResolution(file.path),
            },
            totalSize: torrentData.torrent_size,
        };
    }

    /**
     * Универсальный парсинг
     */
    static parseGeneric(torrentData) {
        const files = torrentData.file_stats.map(file => ({
            id: file.id,
            path: file.path,
            name: path.basename(file.path),
            size: file.length,
            streamUrl: this.buildStreamUrl(torrentData.hash, file.id, file.path),
            extension: path.extname(file.path),
            parentFolder: this.getParentFolderName(file.path),
        }));

        return {
            type: 'generic',
            files: files.sort((a, b) => a.path.localeCompare(b.path)),
            totalFiles: files.length,
            totalSize: torrentData.torrent_size,
        };
    }

    /**
     * Парсинг пути файла
     */
    static parseFilePath(filePath, fileId, fileSize) {
        const parts = filePath.split('/');
        const fileName = parts[parts.length - 1];

        let season = null;
        let episode = null;
        let title = null;
        let isSpecial = false;

        // Проверка на специальные файлы
        if (this.SPECIAL_FILES_PATTERNS.some(pattern => pattern.test(fileName))) {
            isSpecial = true;
        }

        // Поиск сезона в пути
        for (const part of parts) {
            for (const pattern of this.SEASON_PATTERNS) {
                const match = part.match(pattern);
                if (match) {
                    season = parseInt(match[1]);
                    break;
                }
            }
            if (season !== null) break;
        }

        // Поиск серии в имени файла
        for (const pattern of this.EPISODE_PATTERNS) {
            const match = fileName.match(pattern);
            if (match) {
                episode = parseInt(match[1]);
                break;
            }
        }

        // Извлечение названия
        title = this.extractTitle(filePath);

        return {
            season,
            episode,
            title,
            isSpecial,
            fileName,
            fullPath: filePath,
        };
    }

    /**
     * Вспомогательные методы
     */
    static getParentFolderName(filePath) {
        const parts = filePath.split('/');
        return parts.length > 1 ? parts[parts.length - 2] : 'root';
    }

    static getSeasonPath(fileStats, seasonNumber) {
        for (const file of fileStats) {
            const parts = file.path.split('/');
            for (const part of parts) {
                if (part.match(new RegExp(`S${seasonNumber.toString().padStart(2, '0')}|Season\\s*${seasonNumber}|Сезон\\s*${seasonNumber}`, 'i'))) {
                    return part;
                }
            }
        }
        return null;
    }

    static getSeasonTitle(seasonNumber) {
        const seasonNames = {
            0: 'Specials',
            1: 'Season 1',
            2: 'Season 2',
            3: 'Season 3',
            4: 'Season 4',
            5: 'Season 5',
            6: 'Season 6',
            7: 'Season 7',
        };
        return seasonNames[seasonNumber] || `Season ${seasonNumber}`;
    }

    static extractTitle(filePath) {
        const fileName = path.basename(filePath);
        // Удаляем расширение
        let title = fileName.replace(/\.[^/.]+$/, '');
        // Удаляем техническую информацию в квадратных скобках
        title = title.replace(/\s*\[[^\]]+\]/g, '');
        // Удаляем техническую информацию в круглых скобках
        title = title.replace(/\s*\([^)]+\)/g, '');
        // Удаляем номера сезонов и серий
        title = title.replace(/S\d+E\d+/gi, '');
        title = title.replace(/S\d+/gi, '');
        title = title.replace(/E\d+/gi, '');
        title = title.replace(/\d{4}/g, '');
        // Удаляем лишние пробелы и разделители
        title = title.replace(/[._-]/g, ' ');
        title = title.replace(/\s+/g, ' ').trim();
        return title || path.basename(filePath);
    }

    static extractEpisodeTitle(filePath) {
        // Поиск названия после номера серии
        const match = filePath.match(/E\d+\s*[-–]\s*(.+?)\./i);
        if (match) return match[1].trim();

        const match2 = filePath.match(/серия\s*\d+\s*[-–]\s*(.+?)\./i);
        if (match2) return match2[1].trim();

        return null;
    }

    static extractMovieTitle(filePath) {
        let title = path.basename(filePath);
        title = title.replace(/\.[^/.]+$/, '');
        title = title.replace(/\s*\[[^\]]+\]/g, '');
        title = title.replace(/\s*\([^)]+\)/g, '');
        title = title.replace(/[._-]/g, ' ');
        title = title.replace(/\s+/g, ' ').trim();
        return title;
    }

    static extractQuality(filePath) {
        const qualities = ['4K', '2160p', '1080p', '720p', '480p', 'HD', 'SD', 'BDRip', 'WEB-DL', 'WEBDL'];
        for (const quality of qualities) {
            if (filePath.includes(quality)) return quality;
        }
        return 'Unknown';
    }

    static extractResolution(filePath) {
        const resolutions = ['3840x2160', '1920x1080', '1280x720', '720x480'];
        for (const res of resolutions) {
            if (filePath.includes(res)) return res;
        }
        return 'Unknown';
    }

    /**
     * Построение URL для стриминга файла
     * Формат: /stream/{filename}?link={hash}&index={fileId}&play
     */
    static buildStreamUrl(hash, fileId, filePath = null) {
        let filename = '';

        if (filePath) {
            // Извлекаем имя файла из пути
            filename = path.basename(filePath);
            // URL-кодируем имя файла для безопасности
            filename = encodeURIComponent(filename);
        } else {
            // Fallback: используем fileId
            filename = `file_${fileId}`;
        }

        return `/stream/${filename}?link=${hash}&index=${fileId}&play`;
    }

    static countEpisodes(paths) {
        let count = 0;
        for (const path of paths) {
            for (const pattern of this.EPISODE_PATTERNS) {
                if (pattern.test(path)) {
                    count++;
                    break;
                }
            }
        }
        return count;
    }

    static findSeasonFolders(paths) {
        const seasons = new Set();
        for (const path of paths) {
            const parts = path.split('/');
            for (const part of parts) {
                for (const pattern of this.SEASON_PATTERNS) {
                    const match = part.match(pattern);
                    if (match) {
                        seasons.add(parseInt(match[1]));
                        break;
                    }
                }
            }
        }
        return Array.from(seasons).sort((a, b) => a - b);
    }

    static createEmptyStructure(torrentData) {
        return {
            type: 'empty',
            error: 'No files found in torrent',
            torrentInfo: {
                hash: torrentData.hash,
                name: torrentData.name || torrentData.title,
                title: torrentData.title,
                status: torrentData.stat_string,
                addedTime: torrentData.timestamp,
                category: torrentData.category,
                poster: torrentData.poster,
            },
        };
    }
}