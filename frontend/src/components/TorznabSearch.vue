<template>
  <div>
    <!-- Кнопка поиска -->
    <button
        @click="openSearchModal"
        class="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        :disabled="loading"
    >
      <div class="flex items-center justify-center gap-2">
        <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <svg v-else class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{{ loading ? 'Поиск...' : 'Искать' }}</span>
      </div>
    </button>

    <!-- Модальное окно -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-7xl bg-white rounded-xl shadow-2xl transform transition-all">
            <!-- Заголовок -->
            <div class="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-white rounded-t-xl border-b border-gray-200">
              <div class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h3 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Результаты поиска торрентов
                    </h3>
                    <p class="mt-1 text-sm text-gray-500">
                      По запросу: <span class="font-mono text-green-600">{{ searchQuery }}</span>
                    </p>
                  </div>
                  <button
                      @click="closeModal"
                      class="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Фильтры -->
              <div class="px-6 py-3 bg-gray-50 border-t border-b border-gray-200">
                <div class="flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span class="text-sm font-medium text-gray-700">Фильтры:</span>
                  </div>

                  <select v-model="filters.quality" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    <option value="">Все качества</option>
                    <option value="4K">4K Ultra HD</option>
                    <option value="1080p">Full HD (1080p)</option>
                    <option value="720p">HD (720p)</option>
                    <option value="480p">SD (480p)</option>
                  </select>

                  <select v-model="filters.type" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    <option value="">Все типы</option>
                    <option value="DUB">Дубляж</option>
                    <option value="MVO">Многоголосый</option>
                    <option value="DUB+MVO">Дубляж + Многоголосый</option>
                    <option value="Sub">Субтитры</option>
                    <option value="Original">Оригинал</option>
                  </select>

                  <select v-model="filters.sortBy" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                    <option value="seeders">По сидерам (убыв.)</option>
                    <option value="quality">По качеству (убыв.)</option>
                    <option value="size">По размеру (убыв.)</option>
                    <option value="date">По дате (новые)</option>
                  </select>

                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" v-model="filters.showOnlyWithSeeders" class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                    <span class="text-gray-700">Только с сидерами</span>
                  </label>

                  <button
                      v-if="hasActiveFilters"
                      @click="resetFilters"
                      class="ml-auto text-sm text-red-600 hover:text-red-700"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            </div>

            <!-- Контент -->
            <div class="max-h-[calc(100vh-200px)] overflow-y-auto">
              <div v-if="loading" class="flex flex-col items-center justify-center py-12">
                <svg class="animate-spin w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p class="mt-3 text-gray-500">Поиск торрентов...</p>
                <p class="text-sm text-gray-400 mt-1">Это может занять несколько секунд</p>
              </div>

              <div v-else-if="filteredResults.length === 0" class="flex flex-col items-center justify-center py-12">
                <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="mt-3 text-gray-500 text-lg">Ничего не найдено</p>
                <p class="text-sm text-gray-400 mt-1">Попробуйте изменить параметры поиска</p>
              </div>

              <div v-else class="divide-y divide-gray-200">
                <div v-for="(result, index) in filteredResults" :key="index" class="hover:bg-gray-50 transition-colors">
                  <div class="px-6 py-4">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap mb-2">
                          <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="getQualityColor(result.quality)">
                            {{ result.quality }}
                          </span>
                          <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="getTypeColor(result.type)">
                            {{ result.type }}
                          </span>
                          <span v-if="result.audioTracks && result.audioTracks !== 'Unknown'" class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {{ result.audioTracks }}
                          </span>
                          <span class="text-xs text-gray-500">{{ result.formattedDate }}</span>
                        </div>

                        <h4 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1" :title="result.Title">
                          {{ result.Title }}
                        </h4>

                        <div class="flex items-center gap-4 text-xs text-gray-500">
                          <div class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{{ result.formattedSize }}</span>
                          </div>
                          <div class="flex items-center gap-1">
                            <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                            </svg>
                            <span class="font-semibold text-green-600">{{ result.Seed || 0 }}</span>
                            <span>/ {{ result.Peer || 0 }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <a
                            :href="result.Link"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                            @click="trackDownload(result)"
                        >
                          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Скачать
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="sticky bottom-0 bg-gray-50 rounded-b-xl border-t border-gray-200 px-6 py-3">
              <div class="flex items-center justify-between text-sm text-gray-600">
                <div class="flex items-center gap-4">
                  <span>Найдено: <span class="font-semibold text-gray-900">{{ filteredResults.length }}</span> из {{ results.length }}</span>
                  <span class="text-gray-300">|</span>
                  <span>С сидерами: <span class="font-semibold text-green-600">{{ resultsWithSeeders }}</span></span>
                </div>
                <button
                    @click="closeModal"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiClient } from '../api/client.js';

const props = defineProps({
  movie: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['download-track']);

// Состояние
const showModal = ref(false);
const loading = ref(false);
const results = ref([]);
const searchQuery = ref('');

// Фильтры
const filters = ref({
  quality: '',
  type: '',
  sortBy: 'seeders',
  showOnlyWithSeeders: false
});

// Проверка наличия активных фильтров
const hasActiveFilters = computed(() => {
  return filters.value.quality || filters.value.type || filters.value.showOnlyWithSeeders;
});

// Количество результатов с сидерами
const resultsWithSeeders = computed(() => {
  return results.value.filter(r => r.hasSeeders).length;
});

// Отфильтрованные и отсортированные результаты
const filteredResults = computed(() => {
  let filtered = [...results.value];

  if (filters.value.quality) {
    filtered = filtered.filter(r => r.quality === filters.value.quality);
  }

  if (filters.value.type) {
    filtered = filtered.filter(r => r.type === filters.value.type);
  }

  if (filters.value.showOnlyWithSeeders) {
    filtered = filtered.filter(r => r.hasSeeders);
  }

  if (filters.value.sortBy === 'seeders') {
    filtered.sort((a, b) => (b.Seed || 0) - (a.Seed || 0));
  } else if (filters.value.sortBy === 'quality') {
    filtered.sort((a, b) => b.qualityRank - a.qualityRank);
  } else if (filters.value.sortBy === 'size') {
    filtered.sort((a, b) => b.sizeBytes - a.sizeBytes);
  } else if (filters.value.sortBy === 'date') {
    filtered.sort((a, b) => new Date(b.CreateDate) - new Date(a.CreateDate));
  }

  return filtered;
});

// Открыть модальное окно и выполнить поиск
const openSearchModal = async () => {
  showModal.value = true;
  await performSearch();
};

// Закрыть модальное окно
const closeModal = () => {
  showModal.value = false;
  results.value = [];
  resetFilters();
};

// Сброс фильтров
const resetFilters = () => {
  filters.value = {
    quality: '',
    type: '',
    sortBy: 'seeders',
    showOnlyWithSeeders: false
  };
};

// Выполнить поиск через apiClient
const performSearch = async () => {
  loading.value = true;

  try {
    const response = await apiClient.searchTorrentsForMovie(props.movie);

    if (response.success) {
      results.value = response.results;
      searchQuery.value = response.query;
    } else {
      console.error('Search failed:', response.error);
      results.value = [];
    }
  } catch (error) {
    console.error('Search error:', error);

    if (error.status === 503) {
      alert('Torznab сервер недоступен. Проверьте подключение к сети.');
    } else if (error.status === 400) {
      alert('Некорректный запрос. Проверьте введенные данные.');
    } else if (error.status === 408) {
      alert('Превышено время ожидания ответа от сервера.');
    } else {
      alert('Ошибка при поиске торрентов. Попробуйте позже.');
    }

    results.value = [];
  } finally {
    loading.value = false;
  }
};

// Отслеживание скачивания
const trackDownload = (result) => {
  emit('download-track', {
    movie: props.movie,
    torrent: result,
    timestamp: new Date().toISOString()
  });
};

// Цвета для качества
const getQualityColor = (quality) => {
  const colors = {
    '4K': 'bg-purple-100 text-purple-800 border border-purple-200',
    '1080p': 'bg-blue-100 text-blue-800 border border-blue-200',
    '720p': 'bg-green-100 text-green-800 border border-green-200',
    '480p': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'Unknown': 'bg-gray-100 text-gray-800 border border-gray-200'
  };
  return colors[quality] || colors['Unknown'];
};

// Цвета для типа
const getTypeColor = (type) => {
  const colors = {
    'DUB': 'bg-red-100 text-red-800 border border-red-200',
    'MVO': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    'DUB+MVO': 'bg-orange-100 text-orange-800 border border-orange-200',
    'Sub': 'bg-blue-100 text-blue-800 border border-blue-200',
    'Original': 'bg-gray-100 text-gray-800 border border-gray-200',
    'Unknown': 'bg-gray-100 text-gray-800 border border-gray-200'
  };
  return colors[type] || colors['Unknown'];
};

// Проверка здоровья Torznab сервера
const checkTorznabHealth = async () => {
  try {
    const health = await apiClient.checkTorznabHealth();
    if (!health.success || health.status !== 'healthy') {
      console.warn('Torznab server is not healthy');
    }
  } catch (error) {
    console.error('Torznab health check failed:', error);
  }
};

onMounted(() => {
  //checkTorznabHealth();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.max-h-\[calc\(100vh-200px\]\]::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.max-h-\[calc\(100vh-200px\]\]::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.max-h-\[calc\(100vh-200px\]\]::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.max-h-\[calc\(100vh-200px\]\]::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>