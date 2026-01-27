// src/services/DownloadService.js
import fs from 'fs';
import path from 'path';
import proxyManager from '../models/ProxyManager.js';

/**
 * Сервис для скачивания файлов через прокси
 */
export class DownloadService {
    /**
     * Скачивает файл по URL с проверкой существования
     * @param {string} url - URL файла для скачивания
     * @param {string} downloadDir - Директория для сохранения
     * @param {string} fileName - Имя файла (опционально)
     * @param {object} options - Дополнительные опции
     * @returns {Promise<{success: boolean, filePath: string, size: number, existed: boolean, downloaded: boolean}>}
     */
    async downloadFile(url, downloadDir, fileName = null, options = {}) {
        const startTime = Date.now();

        try {
            // Определяем имя файла если не указано
            if (!fileName) {
                fileName = this.extractFileNameFromUrl(url);
            }

            const filePath = path.join(downloadDir, fileName);

            console.log(`📥 Начинаем скачивание:`);
            console.log(`   URL: ${url}`);
            console.log(`   Файл: ${filePath}`);

            // 1. Создаем директорию если нет
            this.ensureDirectoryExists(downloadDir);

            // 2. Проверяем существование файла
            const fileCheck = this.checkExistingFile(filePath, options);
            if (fileCheck.exists && !fileCheck.shouldReplace) {
                console.log(`⏭️  Пропускаем: ${fileCheck.reason}`);
                return {
                    success: true,
                    filePath: filePath,
                    size: fileCheck.size,
                    existed: true,
                    downloaded: false,
                    reason: fileCheck.reason,
                    message: 'Файл уже существует'
                };
            }

            // 3. Удаляем старый файл если нужно
            if (fileCheck.exists && fileCheck.shouldReplace) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  Удален старый файл: ${fileCheck.reason}`);
            }

            // 4. Скачиваем новый файл
            console.log(`📡 Скачивание файла...`);

            const response = await proxyManager.get(url, {
                responseType: 'stream',
                timeout: options.timeout || 180000, // 3 минуты по умолчанию
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    ...options.headers
                },
                ...options.axiosConfig
            });

            // Проверяем статус ответа
            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Получаем информацию о размере
            const contentLength = response.headers['content-length'];
            const totalSize = contentLength ? parseInt(contentLength) : 0;

            console.log(`📏 Размер файла: ${totalSize > 0 ? this.formatBytes(totalSize) : 'неизвестно'}`);

            // 5. Сохраняем файл
            const writer = fs.createWriteStream(filePath);
            let downloaded = 0;
            let lastProgress = 0;

            // Отслеживаем прогресс для больших файлов
            if (totalSize > 1024 * 1024) { // Только для файлов > 1MB
                response.data.on('data', (chunk) => {
                    downloaded += chunk.length;
                    if (totalSize > 0) {
                        const progress = Math.round((downloaded / totalSize) * 100);
                        if (progress >= lastProgress + 10) {
                            console.log(`   📊 ${progress}%`);
                            lastProgress = progress;
                        }
                    }
                });
            }

            // Записываем файл
            response.data.pipe(writer);

            // Ждем завершения
            await new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    const duration = Date.now() - startTime;
                    console.log(`✅ Запись завершена за ${this.formatDuration(duration)}`);
                    resolve();
                });
                writer.on('error', (err) => {
                    console.error('❌ Ошибка записи файла:', err.message);

                    // Пытаемся удалить частично скачанный файл
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (e) {
                        // Игнорируем ошибку удаления
                    }

                    reject(new Error(`Ошибка записи файла: ${err.message}`));
                });
                response.data.on('error', (err) => {
                    console.error('❌ Ошибка потока данных:', err.message);

                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (e) {
                        // Игнорируем ошибку удаления
                    }

                    reject(new Error(`Ошибка получения данных: ${err.message}`));
                });
            });

            // 6. Получаем информацию о скачанном файле
            const stats = fs.statSync(filePath);
            const duration = Date.now() - startTime;

            console.log(`🎉 Файл успешно скачан!`);
            console.log(`   📍 Путь: ${filePath}`);
            console.log(`   📏 Размер: ${this.formatBytes(stats.size)}`);
            console.log(`   ⏱️  Время: ${this.formatDuration(duration)}`);

            return {
                success: true,
                filePath: filePath,
                size: stats.size,
                existed: false,
                downloaded: true,
                duration: duration,
                message: 'Файл успешно скачан',
                downloadInfo: {
                    url: url,
                    fileName: fileName,
                    downloadDir: downloadDir,
                    contentType: response.headers['content-type'],
                    contentLength: totalSize
                }
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`💥 Ошибка скачивания за ${this.formatDuration(duration)}:`, error.message);

            // Улучшенная обработка ошибок
            let errorDetails = {
                message: error.message,
                code: error.code,
                url: url
            };

            if (error.response) {
                errorDetails.httpStatus = error.response.status;
                errorDetails.httpStatusText = error.response.statusText;

                if (error.response.status === 403) {
                    errorDetails.suggestion = 'Доступ запрещен. Проверьте URL или аутентификацию.';
                } else if (error.response.status === 404) {
                    errorDetails.suggestion = 'Файл не найден. Проверьте правильность URL и даты.';
                }
            } else if (error.code === 'ECONNREFUSED') {
                errorDetails.suggestion = 'Не удалось подключиться. Проверьте интернет-соединение и настройки прокси.';
            } else if (error.code === 'ETIMEDOUT') {
                errorDetails.suggestion = 'Таймаут соединения. Попробуйте увеличить timeout.';
            }

            return {
                success: false,
                error: errorDetails,
                duration: duration,
                message: 'Не удалось скачать файл'
            };
        }
    }

    /**
     * Извлекает имя файла из URL
     */
    extractFileNameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const fileName = path.basename(pathname);

            // Если имя файла не найдено, генерируем по дате
            if (!fileName || fileName === '/') {
                const timestamp = new Date().getTime();
                return `download_${timestamp}.gz`;
            }

            return fileName;
        } catch (error) {
            const timestamp = new Date().getTime();
            return `download_${timestamp}.gz`;
        }
    }

    /**
     * Проверяет существование файла и нужно ли его заменять
     */
    checkExistingFile(filePath, options) {
        if (!fs.existsSync(filePath)) {
            return { exists: false, shouldReplace: true };
        }

        const stats = fs.statSync(filePath);
        const now = new Date();
        const fileDate = new Date(stats.mtime);

        // Проверка по размеру (если файл нулевой)
        if (stats.size === 0) {
            return {
                exists: true,
                shouldReplace: true,
                size: 0,
                reason: 'файл пустой (0 байт)'
            };
        }

        // Проверка по дате (если файл сегодняшний и force не включен)
        const isToday = fileDate.toDateString() === now.toDateString();

        if (isToday && !options.force) {
            return {
                exists: true,
                shouldReplace: false,
                size: stats.size,
                reason: 'файл сегодняшний'
            };
        }

        // Проверка по максимальному возрасту (по умолчанию 1 день)
        const maxAge = options.maxAge || 24 * 60 * 60 * 1000; // 24 часа
        const age = now - fileDate;

        if (age < maxAge && !options.force) {
            return {
                exists: true,
                shouldReplace: false,
                size: stats.size,
                reason: `файл не старше ${this.formatDuration(maxAge)}`
            };
        }

        return {
            exists: true,
            shouldReplace: true,
            size: stats.size,
            reason: `файл устарел (${this.formatDuration(age)})`
        };
    }

    /**
     * Создает директорию если не существует
     */
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`📁 Создана директория: ${dirPath}`);
            return true;
        }
        return false;
    }

    /**
     * Форматирует байты в читаемый вид
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Форматирует миллисекунды в читаемый вид
     */
    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
        return `${(ms / 3600000).toFixed(2)}h`;
    }
}

// Экспортируем класс и экземпляр
export default DownloadService;
