import SyncWebSocketServer from './syncServer.js';

let wsServer = null;

export const initWebSocket = (server) => {
    if (!wsServer) {
        wsServer = new SyncWebSocketServer(server);
        console.log('✅ WebSocket сервер инициализирован');
    }
    return wsServer;
};

export const getWsServer = () => {
    if (!wsServer) {
        throw new Error('WebSocket сервер не инициализирован');
    }
    return wsServer;
};