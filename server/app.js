import express from 'express';
import http from 'http';
import cors from 'cors';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Импортируем конфигурацию
import config from './src/config/index.js';
import indexRoutes from './src/routes/index.js';
import { initWebSocket } from './src/websocket/index.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Используем значения из конфигурации
const HOST = config.app.host;
const PORT = config.app.port;

const app = express();
const server = http.createServer(app);

// Инициализируем WebSocket
const wsServer = initWebSocket(server);


app.use('/', express.static(join(__dirname, '../public')));

app.use(cors());
app.use(express.json());

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