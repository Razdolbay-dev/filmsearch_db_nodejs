<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto" @click.self="close">
    <div class="fixed inset-0 bg-black bg-opacity-50"></div>

    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <!-- Заголовок -->
        <div class="flex justify-between items-center p-6 border-b">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              {{ torrentInfo?.name || torrentInfo?.title || 'Загрузка...' }}
            </h2>
            <p class="text-sm text-gray-500 mt-1" v-if="torrentInfo">
              Статус: {{ torrentInfo.status }}
            </p>
          </div>
          <button @click="close" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Содержимое -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Состояние загрузки -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p class="text-gray-600 text-lg font-medium">Обработка ...</p>
            <p class="text-gray-400 text-sm mt-2">Ищем файл на сервере</p>
            <div class="w-64 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div
                  class="h-full bg-blue-600 transition-all duration-500"
                  :style="{ width: `${attemptProgress}%` }"
              ></div>
            </div>
          </div>

          <!-- Данные готовы -->
          <div v-else>
            <!-- Для сериалов -->
            <div v-if="torrentData?.type === 'tv_series'">
              <div v-for="season in torrentData.seasons" :key="season.seasonNumber" class="mb-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">{{ season.title }}</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  <button
                      v-for="episode in season.episodes"
                      :key="episode.id"
                      @click="playVideo(episode.streamUrl)"
                      class="bg-gray-100 hover:bg-blue-100 rounded-lg p-3 text-left transition-colors"
                  >
                    <div class="font-medium text-gray-900">Серия {{ episode.number }}</div>
                    <div class="text-sm text-gray-600 truncate">{{ episode.title }}</div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Для фильмов -->
            <div v-else-if="torrentData?.type === 'movie'">
              <div class="bg-gray-50 rounded-lg p-6 text-center">
                <h3 class="font-semibold text-gray-900 mb-4">Готов к просмотру</h3>
                <button
                    @click="playVideo(torrentData.movie.streamUrl)"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center gap-2 text-lg"
                >
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Смотреть
                </button>
                <p class="text-sm text-gray-500 mt-3">
                  {{ formatSize(torrentData.movie.size) }} • {{ torrentData.movie.quality }}
                </p>
              </div>
            </div>

            <!-- Для коллекций фильмов -->
            <div v-else-if="torrentData?.type === 'movies_collection'">
              <div class="space-y-2">
                <h3 class="font-semibold text-gray-800 mb-3">Выберите фильм</h3>
                <button
                    v-for="movie in torrentData.movies"
                    :key="movie.id"
                    @click="playVideo(movie.streamUrl)"
                    class="w-full bg-gray-50 hover:bg-blue-50 rounded-lg p-3 text-left transition-colors flex justify-between items-center"
                >
                  <div>
                    <div class="font-medium text-gray-900">{{ movie.title }}</div>
                    <div class="text-sm text-gray-500">{{ formatSize(movie.size) }}</div>
                  </div>
                  <span class="text-blue-600">▶</span>
                </button>
              </div>
            </div>

            <!-- Для generic (одиночные файлы) -->
            <div v-else-if="torrentData?.type === 'generic'">
              <div class="space-y-2">
                <h3 class="font-semibold text-gray-800 mb-3">Доступные файлы</h3>
                <button
                    v-for="file in torrentData.files"
                    :key="file.id"
                    @click="playVideo(file.streamUrl)"
                    class="w-full bg-gray-50 hover:bg-blue-50 rounded-lg p-3 text-left transition-colors flex justify-between items-center"
                    :class="{ 'opacity-50 cursor-not-allowed': !isVideoFile(file.extension) }"
                    :disabled="!isVideoFile(file.extension)"
                >
                  <div>
                    <div class="font-medium text-gray-900">{{ file.name }}</div>
                    <div class="text-sm text-gray-500">{{ formatSize(file.size) }}</div>
                  </div>
                  <span v-if="isVideoFile(file.extension)" class="text-blue-600">▶</span>
                  <span v-else class="text-gray-400 text-sm">{{ file.extension }}</span>
                </button>
              </div>
            </div>

            <div v-else class="text-center py-8 text-gray-500">
              Нет доступных файлов для воспроизведения
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { apiClient } from '@/api/client.js';

const props = defineProps({
  visible: Boolean,
  torrentHash: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close']);

const loading = ref(true);
const torrentData = ref(null);
const torrentInfo = ref(null);
const attemptProgress = ref(0);
const maxAttempts = ref(30);

const formatSize = (bytes) => {
  if (!bytes) return 'N/A';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const isVideoFile = (extension) => {
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
  return videoExtensions.includes(extension.toLowerCase());
};

const buildFullUrl = (streamUrl) => {
  return `http://10.1.0.46:8090${streamUrl}`;
};

// Просто открываем ссылку - браузер сам выберет плеер
const playVideo = (streamUrl) => {
  const fullUrl = buildFullUrl(streamUrl);
  window.open(fullUrl, '_blank');
};

// Polling для получения данных торрента
const pollTorrentData = async () => {
  const initialDelay = 5000;
  const pollInterval = 2000;

  await new Promise(resolve => setTimeout(resolve, initialDelay));

  for (let attempt = 1; attempt <= maxAttempts.value; attempt++) {
    attemptProgress.value = (attempt / maxAttempts.value) * 100;

    try {
      const data = await apiClient.getTorrentByHash(props.torrentHash);

      if (data && data.type !== 'empty' &&
          (data.totalFiles > 0 || data.totalEpisodes > 0 || data.movie || data.seasons?.length > 0)) {
        torrentData.value = data;
        torrentInfo.value = data.torrentInfo;
        loading.value = false;
        return;
      }
    } catch (error) {
      console.warn(`Polling error:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  loading.value = false;
  torrentInfo.value = { name: 'Ошибка', title: 'Не удалось загрузить данные', status: 'Timeout' };
};

watch(() => props.visible, async (newVal) => {
  if (newVal && props.torrentHash) {
    loading.value = true;
    torrentData.value = null;
    torrentInfo.value = null;
    attemptProgress.value = 0;
    await pollTorrentData();
  }
}, { immediate: true });

const close = () => {
  emit('close');
  torrentData.value = null;
  torrentInfo.value = null;
};
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>