<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">🎬 Синхронизация TMDB</h1>

    <!-- Панель управления -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex flex-wrap gap-4">
        <button
            @click="startMovies"
            :disabled="loading"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          🎥 Старт фильмов
        </button>

        <button
            @click="startSeries"
            :disabled="loading"
            class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          📺 Старт сериалов
        </button>

        <button
            @click="loadJobs"
            :disabled="loading"
            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          📋 Загрузить задачи
        </button>

        <button
            @click="clearCompleted"
            :disabled="loading"
            class="bg-brown-600 hover:bg-brown-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 flex items-center"
            style="background-color: #795548;"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          🧹 Очистить завершенные
        </button>
      </div>
    </div>

    <!-- WebSocket статус -->
    <div class="mb-4 p-3 rounded-lg flex items-center" :class="socketStatusClass">
      <div class="w-2 h-2 rounded-full mr-2" :class="socketStatusDotClass"></div>
      <span>{{ socketStatusText }}</span>
      <span v-if="activeJobsCount > 0" class="ml-4 text-sm">
        Активных задач: <span class="font-bold">{{ activeJobsCount }}</span>
      </span>
    </div>

    <!-- Список задач -->
    <div v-if="loading && !jobs.length" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="jobs.length === 0" class="bg-white rounded-lg shadow p-12 text-center text-gray-500">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-lg">Нет активных задач</p>
      <p class="text-sm mt-2">Запустите синхронизацию фильмов или сериалов</p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="job in jobs" :key="job.id" class="bg-white rounded-lg shadow overflow-hidden">
        <!-- Заголовок задачи -->
        <div class="p-4 border-b" :class="jobHeaderClass(job.status)">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-lg">#{{ job.id }}: {{ job.job_name }}</h3>
                <span class="px-2 py-1 rounded text-xs font-medium" :class="jobTypeClass(job.job_type)">
                  {{ job.job_type === 'movies' ? '🎥 Фильмы' : '📺 Сериалы' }}
                </span>
                <span class="text-sm text-gray-500">{{ formatDate(job.created_at) }}</span>
              </div>
              <div class="flex items-center mt-1">
                <span class="w-2 h-2 rounded-full mr-2" :class="statusDotClass(job.status)"></span>
                <span :class="statusTextClass(job.status)">{{ getStatusText(job.status) }}</span>
              </div>
            </div>
            <div class="text-sm text-gray-500">
              ID: {{ job.id }}
            </div>
          </div>
        </div>

        <!-- Прогресс бар -->
        <div class="p-4">
          <div class="flex justify-between text-sm mb-1">
            <span>Прогресс</span>
            <span class="font-medium">{{ job.progress || 0 }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div
                class="h-2.5 rounded-full transition-all duration-300"
                :class="progressBarClass(job.status)"
                :style="{ width: `${job.progress || 0}%` }"
            ></div>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-4">
            <div class="bg-green-100 p-3 rounded-lg text-center">
              <div class="text-2xl font-bold text-green-700">
                {{ getCompletedCount(job) }}
              </div>
              <div class="text-sm text-green-600">✅ Успешно</div>
            </div>
            <div class="bg-red-100 p-3 rounded-lg text-center">
              <div class="text-2xl font-bold text-red-700">{{ job.failed_items || 0 }}</div>
              <div class="text-sm text-red-600">❌ Ошибок</div>
            </div>
            <div class="bg-yellow-100 p-3 rounded-lg text-center">
              <div class="text-2xl font-bold text-yellow-700">{{ job.skipped_items || 0 }}</div>
              <div class="text-sm text-yellow-600">⏭️ Пропущено</div>
            </div>
          </div>

          <div class="mt-3 text-sm text-gray-600">
            Всего обработано: <span class="font-medium">{{ job.processed_items || 0 }}/{{ job.total_items || 0 }}</span>
          </div>

          <div v-if="job.current_item_id" class="mt-2 text-sm">
            <span class="text-gray-600">Текущий ID:</span>
            <span class="ml-2 font-mono">{{ job.current_item_id }}</span>
          </div>

          <!-- Кнопки управления -->
          <div class="mt-4 flex flex-wrap gap-2">
            <template v-if="job.status === 'running'">
              <button @click="controlJob(job.id, 'pause')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ⏸️ Пауза
              </button>
            </template>

            <template v-if="job.status === 'paused'">
              <button @click="controlJob(job.id, 'resume')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ▶️ Возобновить
              </button>
            </template>

            <template v-if="job.status === 'running' || job.status === 'paused'">
              <button @click="controlJob(job.id, 'stop')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                ⏹️ Стоп
              </button>
            </template>

            <template v-if="job.status === 'stopped' || job.status === 'completed' || job.status === 'failed'">
              <button @click="controlJob(job.id, 'resume')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                🔄 Перезапустить
              </button>
            </template>

            <button @click="deleteJob(job.id)" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              🗑️ Удалить
            </button>
          </div>

          <!-- Ошибка если есть -->
          <div v-if="job.error_message" class="mt-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            ❌ {{ job.error_message }}
          </div>

          <!-- Последнее обновление -->
          <div v-if="lastUpdate[job.id]" class="mt-2 text-xs text-green-600">
            Обновлено: {{ lastUpdate[job.id] }}
          </div>
        </div>
      </div>
    </div>

    <!-- Лог событий
    <div class="mt-8">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-xl font-bold">📋 Лог событий</h2>
        <button @click="clearLogs" class="text-sm text-gray-500 hover:text-gray-700">
          Очистить лог
        </button>
      </div>
      <div class="bg-black text-green-400 p-4 rounded-lg h-80 overflow-y-auto font-mono text-sm">
        <div v-for="(log, index) in logs" :key="index" class="mb-1">
          <span class="text-gray-500">[{{ log.time }}]</span> {{ log.message }}
        </div>
        <div v-if="logs.length === 0" class="text-gray-600 text-center py-4">
          Нет событий
        </div>
      </div>
    </div>-->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { io } from 'socket.io-client';
import { syncApi } from '@/api/sync.client';

// Состояние
const jobs = ref([]);
const loading = ref(false);
const logs = ref([]);
const lastUpdate = ref({});

// WebSocket
const socketStatus = ref('disconnected');
const socket = io('http://10.1.0.46:5000', {
  path: '/ws/sync'
});

// Количество активных задач
const activeJobsCount = computed(() => {
  return jobs.value.filter(job => ['running', 'paused'].includes(job.status)).length;
});

// Computed свойства для WebSocket статуса
const socketStatusClass = computed(() => ({
  'bg-green-100 text-green-800': socketStatus.value === 'connected',
  'bg-red-100 text-red-800': socketStatus.value === 'disconnected',
  'bg-yellow-100 text-yellow-800': socketStatus.value === 'connecting'
}));

const socketStatusDotClass = computed(() => ({
  'bg-green-500': socketStatus.value === 'connected',
  'bg-red-500': socketStatus.value === 'disconnected',
  'bg-yellow-500 animate-pulse': socketStatus.value === 'connecting'
}));

const socketStatusText = computed(() => {
  switch (socketStatus.value) {
    case 'connected': return '✅ WebSocket подключен';
    case 'connecting': return '⏳ Подключение к WebSocket...';
    default: return '❌ WebSocket отключен';
  }
});

// Форматирование даты
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

// Получение количества успешно обработанных
const getCompletedCount = (job) => {
  return job.completed_items ||
      (job.processed_items - (job.failed_items || 0) - (job.skipped_items || 0)) ||
      0;
};

// Классы для статусов
const jobHeaderClass = (status) => {
  const classes = {
    'running': 'bg-green-50',
    'paused': 'bg-yellow-50',
    'completed': 'bg-blue-50',
    'failed': 'bg-red-50',
    'stopped': 'bg-gray-50',
    'pending': 'bg-orange-50'
  };
  return classes[status] || '';
};

const jobTypeClass = (type) => {
  return type === 'movies'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-orange-100 text-orange-800';
};

const statusDotClass = (status) => {
  const classes = {
    'running': 'bg-green-500 animate-pulse',
    'paused': 'bg-yellow-500',
    'completed': 'bg-blue-500',
    'failed': 'bg-red-500',
    'stopped': 'bg-gray-500',
    'pending': 'bg-orange-500'
  };
  return classes[status] || 'bg-gray-500';
};

const statusTextClass = (status) => {
  const classes = {
    'running': 'text-green-600 font-medium',
    'paused': 'text-yellow-600 font-medium',
    'completed': 'text-blue-600 font-medium',
    'failed': 'text-red-600 font-medium',
    'stopped': 'text-gray-600 font-medium',
    'pending': 'text-orange-600 font-medium'
  };
  return classes[status] || '';
};

const progressBarClass = (status) => {
  const classes = {
    'running': 'bg-green-500',
    'paused': 'bg-yellow-500',
    'completed': 'bg-blue-500',
    'failed': 'bg-red-500',
    'stopped': 'bg-gray-500',
    'pending': 'bg-orange-500'
  };
  return classes[status] || 'bg-blue-500';
};

const getStatusText = (status) => {
  const texts = {
    'running': 'Выполняется',
    'paused': 'На паузе',
    'completed': 'Завершено',
    'failed': 'Ошибка',
    'stopped': 'Остановлено',
    'pending': 'Ожидание'
  };
  return texts[status] || status;
};

// Добавление лога
const addLog = (message) => {
  const time = new Date().toLocaleTimeString();
  logs.value.unshift({ time, message });

  // Ограничиваем длину лога
  if (logs.value.length > 50) {
    logs.value.pop();
  }
};

// Очистка лога
const clearLogs = () => {
  logs.value = [];
};

// Загрузка задач
const loadJobs = async () => {
  loading.value = true;
  try {
    const data = await syncApi.getJobs();
    jobs.value = data.jobs || [];

    // Подписываемся на WebSocket для активных задач
    jobs.value.forEach(job => {
      if (['running', 'paused'].includes(job.status)) {
        socket.emit('subscribe:job', job.id);
      }
    });

    addLog(`📊 Загружено ${jobs.value.length} задач`);
  } catch (error) {
    addLog(`❌ Ошибка загрузки задач: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// Обновление прогресса задачи
const updateJobProgress = (jobId, update) => {
  const jobIndex = jobs.value.findIndex(j => j.id === jobId);
  if (jobIndex === -1) return;

  const job = jobs.value[jobIndex];

  // Обновляем статус если пришел
  if (update.status) {
    job.status = update.status;
  }

  // Обновляем прогресс
  if (update.percentage !== undefined) {
    job.progress = update.percentage;
  }

  // Обновляем статистику
  if (update.stats) {
    job.completed_items = update.stats.completed;
    job.failed_items = update.stats.failed;
    job.skipped_items = update.stats.skipped;
    job.processed_items = update.stats.completed + update.stats.failed + update.stats.skipped;
  }

  // Обновляем текущий элемент
  if (update.currentId) {
    job.current_item_id = update.currentId;
  }

  // Обновляем общее количество
  if (update.total !== undefined) {
    job.total_items = update.total;
  }

  // Время последнего обновления
  lastUpdate.value[jobId] = new Date().toLocaleTimeString();

  // Логируем события
  if (update.event === 'item:completed') {
    addLog(`✅ Job #${jobId}: ${update.message || 'Элемент импортирован'}`);
  } else if (update.event === 'item:skipped') {
    addLog(`⏭️ Job #${jobId}: ${update.message || 'Элемент пропущен'}`);
  } else if (update.event === 'item:failed') {
    addLog(`❌ Job #${jobId}: ${update.message || 'Ошибка импорта'}`);
  } else if (update.event === 'job:completed') {
    addLog(`🎉 Job #${jobId}: ${update.message || 'Задача завершена'}`);
  } else if (update.event === 'job:stopped') {
    addLog(`⏹️ Job #${jobId}: ${update.message || 'Задача остановлена'}`);
  } else if (update.event === 'job:paused') {
    addLog(`⏸️ Job #${jobId}: ${update.message || 'Задача на паузе'}`);
  } else if (update.event === 'job:resumed') {
    addLog(`▶️ Job #${jobId}: ${update.message || 'Задача возобновлена'}`);
  }
};

// Управление задачами
const startMovies = async () => {
  try {
    const data = await syncApi.startMovies();
    addLog(`🎥 Запущена синхронизация фильмов (Job #${data.jobId})`);
    socket.emit('subscribe:job', data.jobId);
    await loadJobs();
  } catch (error) {
    addLog(`❌ Ошибка запуска: ${error.message}`);
  }
};

const startSeries = async () => {
  try {
    const data = await syncApi.startSeries();
    addLog(`📺 Запущена синхронизация сериалов (Job #${data.jobId})`);
    socket.emit('subscribe:job', data.jobId);
    await loadJobs();
  } catch (error) {
    addLog(`❌ Ошибка запуска: ${error.message}`);
  }
};

const controlJob = async (jobId, action) => {
  try {
    await syncApi.controlJob(jobId, action);
    addLog(`🔄 Job #${jobId}: ${action}`);
    // Не перезагружаем все задачи, просто ждем WebSocket обновления
  } catch (error) {
    addLog(`❌ Ошибка ${action} Job #${jobId}: ${error.message}`);
  }
};

const deleteJob = async (jobId) => {
  if (!confirm(`Удалить задачу #${jobId}?`)) return;

  try {
    await syncApi.deleteJob(jobId);
    addLog(`🗑️ Job #${jobId} удалена`);
    // Удаляем из локального списка
    jobs.value = jobs.value.filter(j => j.id !== jobId);
  } catch (error) {
    addLog(`❌ Ошибка удаления Job #${jobId}: ${error.message}`);
  }
};

const clearCompleted = async () => {
  try {
    const result = await syncApi.clearCompleted();
    addLog(`🧹 Очищено ${result.count} завершенных задач`);
    await loadJobs();
  } catch (error) {
    addLog(`❌ Ошибка очистки: ${error.message}`);
  }
};

// WebSocket события
socket.on('connect', () => {
  socketStatus.value = 'connected';
  addLog('✅ WebSocket подключен');

  // Переподписываемся на активные задачи
  jobs.value.forEach(job => {
    if (['running', 'paused'].includes(job.status)) {
      socket.emit('subscribe:job', job.id);
    }
  });
});

socket.on('job:update', (data) => {
  updateJobProgress(data.jobId, data);
});

socket.on('disconnect', () => {
  socketStatus.value = 'disconnected';
  addLog('❌ WebSocket отключен');
});

socket.on('connect_error', () => {
  socketStatus.value = 'disconnected';
  addLog('❌ Ошибка подключения WebSocket');
});

// Монтирование
onMounted(() => {
  loadJobs();
});

// Размонтирование
onUnmounted(() => {
  socket.disconnect();
});
</script>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>