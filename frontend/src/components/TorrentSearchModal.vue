<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto" @click.self="close">
    <!-- Затемнение -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

    <!-- Модальное окно -->
    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <!-- Заголовок -->
        <div class="flex justify-between items-center p-6 border-b">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              Поиск торрентов: {{ searchQuery }}
            </h2>
            <p class="text-sm text-gray-500 mt-1">
              Результаты поиска для "{{ searchQuery }}"
            </p>
          </div>
          <button
              @click="close"
              class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Панель фильтров -->
        <div class="p-4 border-b bg-gray-50">
          <div class="flex flex-wrap gap-4 items-center">
            <!-- Выбор источника -->
            <div class="flex gap-2">
              <button
                  @click="changeSource('all')"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    searchSource === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  ]"
              >
                Все источники
              </button>
              <button
                  @click="changeSource('rutor')"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    searchSource === 'rutor'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  ]"
              >
                RuTor
              </button>
              <button
                  @click="changeSource('torznab')"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    searchSource === 'torznab'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  ]"
              >
                Torznab/Jackett
              </button>
            </div>

            <!-- Фильтр по минимальным сидерам -->
            <div class="flex items-center gap-2 ml-auto">
              <label class="text-sm text-gray-600">Мин. сидеров:</label>
              <select
                  v-model="minSeeders"
                  @change="applyFilters"
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option :value="0">Любое</option>
                <option :value="1">≥ 1</option>
                <option :value="5">≥ 5</option>
                <option :value="10">≥ 10</option>
                <option :value="20">≥ 20</option>
                <option :value="50">≥ 50</option>
                <option :value="100">≥ 100</option>
              </select>
            </div>

            <!-- Кнопка обновления -->
            <button
                @click="performSearch"
                :disabled="loading"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <svg v-if="loading" class="animate-spin h-5 w-5 inline" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-else>Обновить</span>
            </button>
          </div>

          <!-- Статистика -->
          <div v-if="!loading && filteredResults.length > 0" class="mt-3 text-sm text-gray-500">
            Показано: {{ filteredResults.length }} из {{ allResults.length }} результатов
            <span v-if="searchSource !== 'all'" class="ml-2">
              (Источник: {{ searchSource === 'rutor' ? 'RuTor' : 'Torznab/Jackett' }})
            </span>
            <span v-else class="ml-2">
              (RuTor: {{ rutorCount }}, Torznab: {{ torznabCount }})
            </span>
          </div>
        </div>

        <!-- Содержимое -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Состояние загрузки -->
          <div v-if="loading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>

          <!-- Результаты поиска -->
          <div v-else-if="filteredResults.length > 0" class="space-y-4">
            <!-- Список результатов -->
            <div class="space-y-3">
              <div v-for="result in filteredResults" :key="result.id" class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div class="flex justify-between items-start gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h3 class="font-semibold text-gray-900">{{ result.title }}</h3>
                      <!-- Бейдж источника -->
                      <span
                          :class="[
              'text-xs px-2 py-1 rounded-full',
              result.source === 'rutor'
                ? 'bg-green-100 text-green-700'
                : 'bg-purple-100 text-purple-700'
            ]"
                      >
            {{ result.source === 'rutor' ? 'RuTor' : 'Jackett' }}
          </span>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-1 text-sm">
          <span class="text-gray-600">
            📦 {{ result.displaySize || result.size }}
          </span>
                      <span class="text-green-600">
            ⬇️ Сидеров: {{ result.seeders || 0 }}
          </span>
                      <span class="text-orange-600">
            ⬆️ Пиров: {{ result.peers || 0 }}
          </span>
                      <span v-if="result.year" class="text-gray-500">
            📅 {{ result.year }}
          </span>
                    </div>
                  </div>

                  <!-- Кнопка добавления -->
                  <div class="flex gap-2">
                    <button
                        @click="addTorrent(result)"
                        :disabled="addingTorrent === (result.source === 'rutor' ? result.magnet : result.link)"
                        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {{ addingTorrent === (result.source === 'rutor' ? result.magnet : result.link) ? 'Добавление...' : 'Добавить' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Нет результатов -->
          <div v-else-if="!loading" class="text-center py-12">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-gray-500 text-lg">Ничего не найдено</p>
            <p class="text-gray-400 text-sm mt-1">Попробуйте изменить запрос или фильтры</p>
          </div>
        </div>

        <!-- Уведомление о добавлении -->
        <div v-if="notification.show" class="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div :class="[
            'rounded-lg shadow-lg p-4 min-w-[300px]',
            notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          ]">
            <div class="flex items-center gap-2">
              <svg v-if="notification.type === 'success'" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span :class="notification.type === 'success' ? 'text-green-800' : 'text-red-800'">
                {{ notification.message }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { apiClient } from '@/api/client.js';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    default: 'movie',
    validator: (value) => ['movie', 'series'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  year: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['close', 'torrent-added']);

// Состояние
const loading = ref(false);
const allResults = ref([]);
const searchSource = ref('all'); // 'all', 'rutor', 'torznab'
const minSeeders = ref(0);
const addingTorrent = ref(null);
const notification = ref({
  show: false,
  type: 'success',
  message: ''
});

// Кэшированные результаты по источникам
const rutorResults = ref([]);
const torznabResults = ref([]);
const rutorLoaded = ref(false);
const torznabLoaded = ref(false);

// Вычисляемые свойства
const rutorCount = computed(() => rutorResults.value.length);
const torznabCount = computed(() => torznabResults.value.length);

const filteredResults = computed(() => {
  let results = [];

  // Выбираем источник
  if (searchSource.value === 'rutor') {
    results = [...rutorResults.value];
  } else if (searchSource.value === 'torznab') {
    results = [...torznabResults.value];
  } else {
    results = [...rutorResults.value, ...torznabResults.value];
  }

  // Фильтруем по сидерам
  if (minSeeders.value > 0) {
    results = results.filter(r => (r.seeders || 0) >= minSeeders.value);
  }

  // Сортируем по количеству сидеров (по убыванию)
  results.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));

  return results;
});

// Форматирование размера
const formatSize = (sizeStr) => {
  if (!sizeStr) return 'N/A';
  return sizeStr;
};

// Сменить источник поиска
const changeSource = (source) => {
  searchSource.value = source;
};

// Применить фильтры
const applyFilters = () => {
  // Просто обновляем computed
};

// Поиск при открытии
watch(() => props.visible, async (newVal) => {
  if (newVal && props.searchQuery) {
    await performSearch();
  }
});

// Поиск во всех источниках
const performSearch = async () => {
  loading.value = true;

  // Сбрасываем старые результаты
  rutorResults.value = [];
  torznabResults.value = [];
  rutorLoaded.value = false;
  torznabLoaded.value = false;

  // Формируем поисковый запрос: название + год
  let query = props.searchQuery;
  if (props.year && props.year !== 'N/A') {
    query = `${props.searchQuery} ${props.year}`;
  }

  try {
    // Параллельно ищем в обоих источниках
    const searchPromises = [];

    // Поиск в RuTor
    const rutorPromise = apiClient.searchRuTor(query)
        .then(response => {
          rutorResults.value = response.results || [];
          rutorLoaded.value = true;
          return response;
        })
        .catch(error => {
          console.error('RuTor search error:', error);
          rutorLoaded.value = true;
          return { results: [] };
        });

    // Поиск в Torznab
    const torznabPromise = apiClient.searchTorznab(query)
        .then(response => {
          torznabResults.value = response.results || [];
          torznabLoaded.value = true;
          return response;
        })
        .catch(error => {
          console.error('Torznab search error:', error);
          torznabLoaded.value = true;
          return { results: [] };
        });

    searchPromises.push(rutorPromise, torznabPromise);
    await Promise.all(searchPromises);

    allResults.value = [...rutorResults.value, ...torznabResults.value];

    // Показываем уведомление о количестве результатов
    const totalCount = allResults.value.length;
    if (totalCount > 0) {
      showNotification(`Найдено ${totalCount} результатов (RuTor: ${rutorResults.value.length}, Torznab: ${torznabResults.value.length})`, 'success');
    } else {
      showNotification('Ничего не найдено', 'error');
    }
  } catch (error) {
    console.error('Search error:', error);
    showNotification('Ошибка поиска: ' + error.message, 'error');
  } finally {
    loading.value = false;
  }
};

// Добавить торрент
const addTorrent = async (result) => {
  // Определяем, какую ссылку использовать
  let torrentLink;

  if (result.source === 'rutor') {
    // Для RuTor используем magnet-ссылку
    torrentLink = result.magnet;
    if (!torrentLink) {
      showNotification('Ошибка: для RuTor не найдена magnet-ссылка', 'error');
      return;
    }
  } else if (result.source === 'torznab') {
    // Для Torznab используем прямую ссылку
    torrentLink = result.link;
    if (!torrentLink) {
      showNotification('Ошибка: для Torznab не найдена ссылка', 'error');
      return;
    }
  } else {
    showNotification('Ошибка: неизвестный источник', 'error');
    return;
  }

  addingTorrent.value = torrentLink;

  try {
    // Формируем название для добавления
    let title = result.title;

    const response = await apiClient.addTorrentToTorrServer(torrentLink, {
      title: title,
      category: props.mediaType === 'movie' ? 'Movie' : 'TV Series',
      saveToDb: true
    });

    showNotification(`Торрент успешно добавлен: ${result.title}`, 'success');
    emit('torrent-added', response);

    // Закрываем модальное окно через 1 секунду
    setTimeout(() => {
      close();
    }, 1000);
  } catch (error) {
    console.error('Add torrent error:', error);
    showNotification(`Ошибка добавления: ${error.message}`, 'error');
  } finally {
    addingTorrent.value = null;
  }
};

// Показать уведомление
const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    type,
    message
  };

  setTimeout(() => {
    notification.value.show = false;
  }, 3000);
};

// Закрыть модальное окно
const close = () => {
  emit('close');
};
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>