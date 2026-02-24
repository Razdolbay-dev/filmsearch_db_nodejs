import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Импортируем конфигурацию
import config from './src/config/index.js';
import indexRoutes from './src/routes/index.js';
import { initWebSocket } from './src/websocket/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendPath = join(__dirname, '../frontend/dist');

// Используем значения из конфигурации
const HOST = config.app.host;
const PORT = config.app.port;

// Настройка CORS
const corsOptions = {
    origin: [
        'http://10.1.0.46:5000',
        'http://192.168.1.97:5000',
        'http://localhost:5000',
        'http://10.1.0.46:5173', // если используешь dev server
        'http://localhost:5173'
    ],
    credentials: true, // ОБЯЗАТЕЛЬНО для cookies
    optionsSuccessStatus: 200
};

const app = express();
const server = http.createServer(app);

// Инициализируем WebSocket
const wsServer = initWebSocket(server);

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Добавляем middleware для установки дополнительных заголовков
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'TMDB API Proxy',
        version: '1.0.0',
        environment: config.app.env,
        services: ['movies', 'series', 'info'],
        proxy_enabled: config.proxy.enabled,
        documentation: '/api/info'
    });
});

app.use('/api', indexRoutes);

// Раздача статических файлов фронтенда
app.use(express.static(frontendPath));

// Все остальные маршруты отдаем index.html для SPA
// **Специальные маршруты для SPA - ТОЛЬКО для не-API путей**
// Это должен быть ПОСЛЕДНИЙ middleware
// SPA маршруты
app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/ws')) {
        return next();
    }

    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return next();
    }

    res.sendFile(join(frontendPath, 'index.html'), (err) => {
        if (err) {
            console.error('❌ Error sending index.html:', err);
            res.status(404).json({
                error: 'Frontend not found',
                message: 'Please build the frontend first'
            });
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Маршрут не найден',
        path: req.path
    });
});

app.use((err, req, res, next) => {
    console.log('Ошибка сервера: ', err.stack);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: err.message
    });
});

server.listen(PORT, HOST, () => {
    console.log(`
🚀 Server started ${HOST}:${PORT}/api

📦 Configuration:
   Database: ${config.database.username ? '✓ Configured' : '✗ Not configured'}
   TMDB API: ${config.tmdb.apiKey ? '✓ Configured' : '✗ Not configured'}
   Proxy: ${config.proxy.enabled ? '✓ Enabled' : '✗ Disabled'}
   📡 WebSocket endpoint: ws://${HOST}:${PORT}/ws/sync
    `);
});

export { app, server };