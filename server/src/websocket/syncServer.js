import { Server } from 'socket.io';

class SyncWebSocketServer {
    constructor(server) {
        this.io = new Server(server, {
            path: '/ws/sync',
            cors: {
                origin: '*', // В продакшене заменить на твой фронтенд
                credentials: true
            }
        });

        this.activeJobs = new Map(); // jobId -> Set of socket ids
        this.setupHandlers();
    }

    setupHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 WebSocket клиент подключен: ${socket.id}`);

            // Подписка на обновления задачи
            socket.on('subscribe:job', (jobId) => {
                socket.join(`job:${jobId}`);

                if (!this.activeJobs.has(jobId)) {
                    this.activeJobs.set(jobId, new Set());
                }
                this.activeJobs.get(jobId).add(socket.id);

                console.log(`📊 Клиент ${socket.id} подписан на задачу ${jobId}`);

                // Отправляем подтверждение
                socket.emit('subscribed', {
                    jobId,
                    message: 'Успешная подписка на обновления'
                });
            });

            // Отписка от задачи
            socket.on('unsubscribe:job', (jobId) => {
                socket.leave(`job:${jobId}`);
                this.activeJobs.get(jobId)?.delete(socket.id);
                console.log(`📉 Клиент ${socket.id} отписался от задачи ${jobId}`);
            });

            // Запрос текущего статуса задачи
            socket.on('job:status', async (jobId) => {
                // Эту функцию мы реализуем позже, когда сделаем роуты
                socket.emit('job:status:requested', { jobId });
            });

            socket.on('disconnect', () => {
                // Очищаем подписки при отключении
                this.activeJobs.forEach((subs, jobId) => {
                    subs.delete(socket.id);
                    if (subs.size === 0) {
                        this.activeJobs.delete(jobId);
                    }
                });
                console.log(`🔌 WebSocket клиент отключен: ${socket.id}`);
            });
        });
    }

    // Отправка обновления всем подписчикам задачи
    broadcastJobUpdate(jobId, data) {
        this.io.to(`job:${jobId}`).emit('job:update', {
            jobId,
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    // Отправка обновления конкретному клиенту
    sendToClient(socketId, event, data) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            socket.emit(event, data);
        }
    }

    // Получить количество подписчиков задачи
    getSubscribersCount(jobId) {
        const room = this.io.sockets.adapter.rooms.get(`job:${jobId}`);
        return room ? room.size : 0;
    }
}

export default SyncWebSocketServer;