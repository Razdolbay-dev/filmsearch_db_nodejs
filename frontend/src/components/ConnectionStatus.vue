<template>
  <div
      v-if="!isConnected && !checking"
      class="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>Нет соединения с API ({{ currentApiUrl }})</span>
  </div>

  <div
      v-if="isConnected && showSuccess"
      class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-fade-out"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
    <span>API подключено ({{ currentApiUrl }})</span>
  </div>

  <!-- Индикатор текущего адреса (только в разработке) -->
  <div
      v-if="showDebugInfo"
      class="fixed bottom-4 left-4 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg opacity-50 hover:opacity-100 transition-opacity"
  >
    <div>🌐 Вы подключены к: <span class="font-mono">{{ windowLocation }}</span></div>
    <div>🔌 API: <span class="font-mono">{{ currentApiUrl }}</span></div>
    <div class="text-green-400 mt-1">✨ Автоопределение хоста активно</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { apiClient } from '../api/client';

const isConnected = ref(true);
const checking = ref(true);
const showSuccess = ref(false);
const showDebugInfo = ref(import.meta.env.DEV); // Только в разработке

const currentApiUrl = computed(() => apiClient.getCurrentApiUrl());
const windowLocation = computed(() => window.location.host);

let checkInterval;

const checkConnection = async () => {
  try {
    const connected = await apiClient.checkConnection();

    if (connected && !isConnected.value) {
      // Соединение восстановилось
      isConnected.value = true;
      showSuccess.value = true;
      setTimeout(() => {
        showSuccess.value = false;
      }, 3000);
    } else if (!connected && isConnected.value) {
      // Соединение потеряно
      isConnected.value = false;
    }

    checking.value = false;
  } catch (error) {
    console.error('Connection check failed:', error);
    isConnected.value = false;
    checking.value = false;
  }
};

onMounted(() => {
  checkConnection();
  // Проверяем соединение каждые 30 секунд
  checkInterval = setInterval(checkConnection, 30000);

  // Логируем информацию при запуске
  console.log('🚀 Frontend запущен на:', window.location.href);
  console.log('🔌 API будет доступен по:', currentApiUrl.value);
});

onUnmounted(() => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
});
</script>

<style scoped>
@keyframes fade-out {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

.animate-fade-out {
  animation: fade-out 3s ease-in-out forwards;
}
</style>