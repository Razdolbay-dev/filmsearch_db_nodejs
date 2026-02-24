import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';

// Глобальный обработчик ошибок для отладки
window.addEventListener('error', (event) => {
    console.error('🔥 Глобальная ошибка:', event.error);
    console.error('Компонент:', event.error?.component);
    console.error('Трассировка:', event.error?.stack);
});

// Перехват необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Необработанный промис:', event.reason);
});

const app = createApp(App);

// Конфигурация приложения
app.config.errorHandler = (err, instance, info) => {
    console.error('❌ Vue Error:', err);
    console.error('Component:', instance);
    console.error('Info:', info);
};

app.use(router);
app.mount('#app');