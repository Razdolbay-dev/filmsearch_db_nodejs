class TorrServerAPI {
    config = {
        // Бэкенд API (ваш Node.js сервер)
        backend: {
            host: 'http://10.1.0.46:5000',
            apiPath: '/api/torrserver'
        },

        // TorrServer - убедись, что адрес правильный и доступный
        torrServer: {
            host: 'http://10.1.0.46:8090'  // Убедись, что это правильный адрес
        },

        // Настройки поиска
        search: {
            defaultLimit: 50,
            minSeeders: 1,
            maxAttempts: 60,
            retryDelay: 2000
        }
    }
    constructor() {
        this.backendURL = `${this.config.backend.host}${this.config.backend.apiPath}`
        this.torrServerURL = this.config.torrServer.host
        console.log('API initialized with:', {
            backendURL: this.backendURL,
            torrServerURL: this.torrServerURL
        })
    }

    /**
     * Универсальный метод для GET запросов к бэкенду
     */
    async get(endpoint, params = {}) {
        const url = new URL(`${this.backendURL}${endpoint}`)
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url.searchParams.append(key, params[key])
            }
        })

        console.log('GET request:', url.toString())
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
    }

    /**
     * Универсальный метод для POST запросов к бэкенду
     */
    async post(endpoint, data = {}) {
        const url = `${this.backendURL}${endpoint}`
        console.log('POST request:', url, data)
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
    }

    /**
     * Универсальный метод для DELETE запросов к бэкенду
     */
    async delete(endpoint, params = {}) {
        const url = new URL(`${this.backendURL}${endpoint}`)
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url.searchParams.append(key, params[key])
            }
        })

        console.log('DELETE request:', url.toString())
        const response = await fetch(url, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
    }

    /**
     * Универсальный метод для PATCH запросов к бэкенду
     */
    async patch(endpoint, data = {}) {
        const url = `${this.backendURL}${endpoint}`
        console.log('PATCH request:', url, data)
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
    }

    // ==================== Поиск ====================

    /**
     * Универсальный поиск (с приоритетом RuTor)
     */
    async search(query, options = {}) {
        const { limit = 50, minSeeders = 1, priority = 'rutor', fallback = true } = options
        return this.get('/search', {
            q: query,
            limit,
            minSeeders,
            priority,
            fallback: fallback.toString()
        })
    }

    /**
     * Поиск только в RuTor
     */
    async searchRuTor(query) {
        return this.get('/search/rutor', { q: query })
    }

    /**
     * Поиск только в Torznab
     */
    async searchTorznab(query) {
        return this.get('/search/torznab', { q: query })
    }

    // ==================== Добавление торрентов ====================

    /**
     * Универсальное добавление торрента
     * Поддерживает:
     * - magnet ссылки (RuTor)
     * - Jackett ссылки (Torznab)
     */
    async addTorrent(link, options = {}) {
        const { title, category = 'Movie', poster, saveToDb = true } = options

        const payload = {
            link: link,
            saveToDb: saveToDb
        }

        // Добавляем опциональные поля
        if (title) payload.title = title
        if (category) payload.category = category
        if (poster) payload.poster = poster

        const response = await this.post('/torrents/add', payload)

        if (!response.success) {
            throw new Error(response.message || 'Ошибка при добавлении торрента')
        }

        return response.result
    }

    /**
     * Добавить торрент по magnet-ссылке (для обратной совместимости)
     */
    async addTorrentByMagnet(magnet, options = {}) {
        return this.addTorrent(magnet, options)
    }

    /**
     * Добавить торрент по .torrent файлу (base64)
     */
    async addTorrentByFile(torrentFile, options = {}) {
        const { title, category, poster, saveToDb = true } = options

        const payload = {
            torrentFile: torrentFile,
            saveToDb: saveToDb
        }

        if (title) payload.title = title
        if (category) payload.category = category
        if (poster) payload.poster = poster

        const response = await this.post('/torrents/add/file', payload)
        return response
    }

    // ==================== Получение информации ====================

    /**
     * Получить информацию о торренте по хешу
     */
    async getTorrentInfo(hash) {
        return this.get(`/torrents/${hash}`)
    }

    /**
     * Получить список всех торрентов
     */
    async getAllTorrents() {
        return this.get('/torrents')
    }

    /**
     * Получить только активные торренты
     */
    async getActiveTorrents() {
        return this.get('/torrents/active')
    }

    /**
     * Получить статистику по торренту
     */
    async getTorrentStats(hash) {
        return this.get(`/torrents/${hash}/stats`)
    }

    /**
     * Ожидание загрузки торрента с повторными попытками
     */
    async waitForTorrent(hash, options = {}) {
        const { maxAttempts = 60, delay = 2000 } = options

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`Attempt ${attempt}/${maxAttempts} to get torrent ${hash}`)
                const data = await this.getTorrentInfo(hash)

                // Проверяем, что торрент загружен и есть файлы
                if (data && (data.files?.length > 0 || data.seasons?.length > 0 || data.movie)) {
                    console.log('Torrent loaded successfully:', data)
                    return data
                }

                // Если торрент еще не готов, ждем
                if (attempt < maxAttempts) {
                    await this.sleep(delay)
                }
            } catch (error) {
                console.log(`Attempt ${attempt} failed:`, error.message)
                if (attempt < maxAttempts) {
                    await this.sleep(delay)
                } else {
                    throw new Error(`Торрент не загрузился за ${maxAttempts * delay / 1000} секунд`)
                }
            }
        }

        throw new Error('Превышено время ожидания загрузки торрента')
    }

    // ==================== Управление торрентами ====================

    /**
     * Удалить торрент (из памяти, но оставить в БД)
     */
    async removeTorrent(hash) {
        return this.delete(`/torrents/${hash}`)
    }

    /**
     * Полностью удалить торрент из БД
     */
    async wipeTorrent(hash) {
        return this.delete(`/torrents/${hash}/wipe`)
    }

    /**
     * Остановить торрент (drop)
     */
    async dropTorrent(hash) {
        return this.post(`/torrents/${hash}/drop`)
    }

    /**
     * Обновить информацию о торренте
     */
    async updateTorrentInfo(hash, updates) {
        const { title, category, poster, data } = updates

        const payload = {}
        if (title) payload.title = title
        if (category) payload.category = category
        if (poster) payload.poster = poster
        if (data) payload.data = data

        return this.patch(`/torrents/${hash}`, payload)
    }

    /**
     * Управление состоянием торрента (start/pause)
     */
    async controlTorrent(hash, action) {
        return this.post(`/torrents/${hash}/control`, { action })
    }

    /**
     * Принудительно запустить торрент
     */
    async startTorrent(hash) {
        return this.controlTorrent(hash, 'start')
    }

    /**
     * Приостановить торрент
     */
    async pauseTorrent(hash) {
        return this.controlTorrent(hash, 'pause')
    }

    // ==================== Воспроизведение ====================

    /**
     * Получить полный URL для воспроизведения видео
     */
    getStreamUrl(streamUrl) {
        if (!streamUrl) return null

        // Если URL уже полный
        if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
            return streamUrl
        }

        // Очищаем URL от лишних слешей
        const cleanStreamUrl = streamUrl.startsWith('/') ? streamUrl : `/${streamUrl}`
        const fullUrl = `${this.torrServerURL}${cleanStreamUrl}`
        console.log('Generated stream URL:', fullUrl)
        return fullUrl
    }

    /**
     * Воспроизвести фильм (первый файл)
     */
    async playMovie(hash) {
        console.log('Playing movie with hash:', hash)
        const torrentInfo = await this.getTorrentInfo(hash)
        console.log('Torrent info for movie:', torrentInfo)

        // Если торрент определен как movie
        if (torrentInfo.type === 'movie' && torrentInfo.movie) {
            const streamUrl = this.getStreamUrl(torrentInfo.movie.streamUrl)
            console.log('Movie stream URL:', streamUrl)
            return streamUrl
        }

        // Если есть files массив
        if (torrentInfo.files && torrentInfo.files.length > 0) {
            const movieFile = torrentInfo.files[0]
            const streamUrl = this.getStreamUrl(movieFile.streamUrl)
            console.log('Movie stream URL from files:', streamUrl)
            return streamUrl
        }

        // Если есть seasons (сериал)
        if (torrentInfo.seasons && torrentInfo.seasons.length > 0) {
            throw new Error('Это сериал, используйте playEpisode для воспроизведения')
        }

        throw new Error('Не найдены файлы для воспроизведения')
    }

    /**
     * Получить информацию о сериале
     */
    async getSeriesInfo(hash) {
        const torrentInfo = await this.getTorrentInfo(hash)

        if (torrentInfo.type === 'anime_series' || torrentInfo.type === 'tv_series') {
            return {
                seasons: torrentInfo.seasons || [],
                totalEpisodes: torrentInfo.totalEpisodes || 0,
                totalSize: torrentInfo.totalSize || 0,
                torrentInfo: torrentInfo.torrentInfo,
                type: torrentInfo.type
            }
        }

        // Если торрент не определен как сериал, но имеет структуру сериала
        if (torrentInfo.seasons && torrentInfo.seasons.length > 0) {
            return {
                seasons: torrentInfo.seasons,
                totalEpisodes: torrentInfo.totalEpisodes || 0,
                totalSize: torrentInfo.totalSize || 0,
                torrentInfo: torrentInfo.torrentInfo,
                type: 'tv_series'
            }
        }

        throw new Error('Это не сериал')
    }

    /**
     * Воспроизвести серию сериала
     */
    async playEpisode(hash, seasonNumber, episodeNumber) {
        const seriesInfo = await this.getSeriesInfo(hash)

        const season = seriesInfo.seasons.find(s => s.seasonNumber === seasonNumber)
        if (!season) {
            throw new Error(`Сезон ${seasonNumber} не найден`)
        }

        const episode = season.episodes.find(e => e.number === episodeNumber)
        if (!episode) {
            throw new Error(`Серия ${episodeNumber} в сезоне ${seasonNumber} не найдена`)
        }

        return this.getStreamUrl(episode.streamUrl)
    }

    /**
     * Получить все серии сериала
     */
    async getAllEpisodes(hash) {
        const seriesInfo = await this.getSeriesInfo(hash)

        const allEpisodes = []
        for (const season of seriesInfo.seasons) {
            for (const episode of season.episodes) {
                allEpisodes.push({
                    season: season.seasonNumber,
                    episode: episode.number,
                    title: episode.title,
                    size: episode.size,
                    streamUrl: this.getStreamUrl(episode.streamUrl)
                })
            }
        }

        return {
            ...seriesInfo,
            allEpisodes
        }
    }

    // ==================== Утилиты ====================

    /**
     * Проверить доступность TorrServer
     */
    async healthCheck() {
        try {
            await this.get('/health')
            return { status: 'ok', connected: true }
        } catch (error) {
            return { status: 'error', connected: false, message: error.message }
        }
    }

    /**
     * Извлечь hash из magnet-ссылки
     */
    extractHashFromMagnet(magnet) {
        const match = magnet?.match(/btih:([a-f0-9]+)/i)
        return match ? match[1] : null
    }

    /**
     * Получить ссылку для добавления из результата поиска
     */
    getTorrentLink(result) {
        // Для RuTor
        if (result.source === 'rutor') {
            return result.magnet || result.magnetLink
        }

        // Для Torznab
        if (result.source === 'torznab') {
            return result.link || result.torrentLink
        }

        // Если нет source, пытаемся определить по наличию полей
        if (result.magnet || result.magnetLink) {
            return result.magnet || result.magnetLink
        }

        if (result.link) {
            return result.link
        }

        return null
    }

    /**
     * Форматирование размера
     */
    formatSize(bytes) {
        if (!bytes) return '0 B'
        if (typeof bytes === 'string') return bytes

        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
    }

    /**
     * Задержка
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Получить название качества видео
     */
    getQualityName(qualityCode) {
        const qualities = {
            0: 'Unknown',
            100: '720p',
            101: '720p',
            200: '1080p',
            201: '1080p',
            202: '1080p',
            203: '1080p',
            300: '4K',
            301: '4K SDR',
            302: '4K HDR',
            305: '4K HDR',
            308: '4K HDR'
        }
        return qualities[qualityCode] || `Quality ${qualityCode}`
    }

    /**
     * Получить название источника
     */
    getSourceName(source) {
        const sources = {
            rutor: 'RuTor',
            torznab: 'Torznab',
            all: 'Все источники'
        }
        return sources[source] || source
    }

    /**
     * Получить тип контента по названию
     */
    getContentType(title) {
        const lowerTitle = title?.toLowerCase() || ''

        if (lowerTitle.includes('season') ||
            lowerTitle.includes('сезон') ||
            /s\d{2}/i.test(lowerTitle)) {
            return 'series'
        }

        if (lowerTitle.includes('movie') ||
            lowerTitle.includes('фильм')) {
            return 'movie'
        }

        return 'unknown'
    }

    /**
     * Сохранить историю загрузки в localStorage
     */
    saveDownloadHistory(item) {
        try {
            const key = item.type === 'movie' ? 'movie_downloads' : 'series_downloads'
            const downloads = JSON.parse(localStorage.getItem(key) || '[]')

            downloads.unshift({
                ...item,
                timestamp: Date.now(),
                date: new Date().toISOString()
            })

            // Сохраняем только последние 100 записей
            const limitedDownloads = downloads.slice(0, 100)
            localStorage.setItem(key, JSON.stringify(limitedDownloads))

            return limitedDownloads
        } catch (error) {
            console.error('Error saving download history:', error)
            return []
        }
    }

    /**
     * Получить историю загрузок
     */
    getDownloadHistory(type = 'all') {
        try {
            if (type === 'movie') {
                return JSON.parse(localStorage.getItem('movie_downloads') || '[]')
            }
            if (type === 'series') {
                return JSON.parse(localStorage.getItem('series_downloads') || '[]')
            }

            const movies = JSON.parse(localStorage.getItem('movie_downloads') || '[]')
            const series = JSON.parse(localStorage.getItem('series_downloads') || '[]')

            return [...movies, ...series].sort((a, b) => b.timestamp - a.timestamp)
        } catch (error) {
            console.error('Error getting download history:', error)
            return []
        }
    }

    /**
     * Очистить историю загрузок
     */
    clearDownloadHistory(type = 'all') {
        try {
            if (type === 'movie') {
                localStorage.removeItem('movie_downloads')
            } else if (type === 'series') {
                localStorage.removeItem('series_downloads')
            } else {
                localStorage.removeItem('movie_downloads')
                localStorage.removeItem('series_downloads')
            }
            return true
        } catch (error) {
            console.error('Error clearing download history:', error)
            return false
        }
    }
}

// Создаем и экспортируем единственный экземпляр
const torrServerAPI = new TorrServerAPI()
export default torrServerAPI