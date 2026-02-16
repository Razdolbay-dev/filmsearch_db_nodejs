// websocket/simple-test.js
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('Клиент подключился:', socket.id);

    socket.on('subscribe:job', (jobId) => {
        console.log(`Клиент ${socket.id} подписался на задачу ${jobId}`);
        socket.join(`job:${jobId}`);

        // Отправляем приветственное сообщение
        socket.emit('job:update', {
            jobId,
            message: 'Вы подписаны на обновления',
            timestamp: new Date().toISOString()
        });
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключился:', socket.id);
    });
});

httpServer.listen(3001, () => {
    console.log('WebSocket сервер на порту 3001');
});