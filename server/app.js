import express from 'express';
import http from 'http';
import cors from 'cors';
import indexRoutes from './src/routes/index.js';

// import { setupWebSocket } from './src/controllers/wsController.js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Импортируем конфигурацию
import config from './src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Используем значения из конфигурации
const HOST = config.app.host;
const PORT = config.app.port;

const app = express();
const server = http.createServer(app);

// Настройка WebSocket
// setupWebSocket(server);

app.use('/', express.static(join(__dirname, '../frontend/dist')));

app.use(cors());
app.use(express.json());

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
📊 Monitor: ${HOST}:${PORT}/monitor
🔗 WebSocket: ws://${HOST}:${PORT}

📦 Configuration:
   Database: ${config.database.username ? '✓ Configured' : '✗ Not configured'}
   TMDB API: ${config.tmdb.apiKey ? '✓ Configured' : '✗ Not configured'}
   Proxy: ${config.proxy.enabled ? '✓ Enabled' : '✗ Disabled'}
    `);
});

export { app, server };