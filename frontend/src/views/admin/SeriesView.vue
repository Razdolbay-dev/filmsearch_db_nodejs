<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Управление сериалами</h1>
      <button
          @click="showAddModal = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Добавить сериал
      </button>
    </div>

    <!-- Поиск и фильтры -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="Поиск по названию..."
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div class="flex gap-2">
          <select
              v-model="filterStatus"
              @change="applyStatusFilter"
              class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Все статусы</option>
            <option value="Returning Series">Возвращается</option>
            <option value="Ended">Завершен</option>
            <option value="In Production">В производстве</option>
          </select>

          <!-- Кнопка сброса фильтров -->
          <button
              v-if="searchQuery || filterStatus"
              @click="clearFilters"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition flex items-center"
              title="Сбросить все фильтры"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Счетчик сериалов и индикатор загрузки -->
    <div class="flex justify-between items-center mb-4">
      <div class="text-sm text-gray-600">
        Показано {{ series.length }} сериалов
        <span v-if="hasMore" class="ml-2 text-gray-400">(загружено {{ loadedPages }} из {{ totalPages }})</span>
      </div>
      <div v-if="loading && !initialLoading" class="text-blue-600 text-sm">
        Загрузка...
      </div>
    </div>

    <!-- Сетка карточек сериалов -->
    <div class="relative min-h-[400px]">
      <!-- Индикатор первоначальной загрузки -->
      <div v-if="initialLoading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>

      <!-- Сетка сериалов -->
      <div v-else-if="series.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
            v-for="item in series"
            :key="item.id"
            class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
        >
          <!-- Постер -->
          <div class="relative aspect-[2/3] bg-gray-200 cursor-pointer" @click="goToSeriesDetails(item.id)">
            <img
                v-if="item.poster_path"
                :src="`/images/posters${item.poster_path}`"
                :alt="item.name"
                class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <!-- Рейтинг на постере -->
            <div class="absolute top-2 right-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-bold shadow-lg">
              ★ {{ Number(item.vote_average).toFixed(1) }}
            </div>

            <!-- Статус на постере -->
            <div class="absolute top-2 left-2">
              <span class="px-2 py-1 rounded-full text-xs font-bold shadow-lg"
                    :class="{
                      'bg-green-100 text-green-800': item.status === 'Returning Series',
                      'bg-gray-100 text-gray-800': item.status === 'Ended',
                      'bg-blue-100 text-blue-800': item.status === 'In Production'
                    }">
                {{ item.status === 'Returning Series' ? 'Возвращается' :
                  item.status === 'Ended' ? 'Завершен' :
                      item.status === 'In Production' ? 'В производстве' : item.status }}
              </span>
            </div>
          </div>

          <!-- Информация о сериале -->
          <div class="p-4 flex-grow">
            <h3 class="font-bold text-lg mb-1 line-clamp-1">
              <a @click="goToSeriesDetails(item.id)" class="cursor-pointer hover:text-blue-600">
                {{ item.name }}
              </a>
            </h3>
            <p class="text-sm text-gray-600 mb-2 line-clamp-1">{{ item.original_name }}</p>

            <div class="flex flex-wrap gap-2 mb-3 text-sm">
              <span class="bg-gray-100 px-2 py-1 rounded">
                {{ item.first_air_date?.split('-')[0] || 'N/A' }} —
                {{ item.last_air_date?.split('-')[0] || 'н.в.' }}
              </span>
              <span class="bg-gray-100 px-2 py-1 rounded">
                {{ item.original_language?.toUpperCase() }}
              </span>
              <span class="bg-gray-100 px-2 py-1 rounded">
                📺 {{ item.number_of_seasons || 0 }} сез.
              </span>
              <span class="bg-gray-100 px-2 py-1 rounded">
                📼 {{ item.number_of_episodes || 0 }} эп.
              </span>
            </div>

            <p v-if="item.overview" class="text-sm text-gray-700 line-clamp-3 mb-3">
              {{ item.overview }}
            </p>
          </div>

          <!-- Действия -->
          <div class="px-4 py-3 bg-gray-50 border-t flex justify-end space-x-2">
            <button @click="editSeries(item)" class="text-blue-600 hover:text-blue-800 p-2" title="Редактировать">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="manageSeasons(item)" class="text-green-600 hover:text-green-800 p-2" title="Управление сезонами">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button @click="confirmDelete(item)" class="text-red-600 hover:text-red-800 p-2" title="Удалить">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button @click="excludeSeries(item)"
                    class="text-orange-600 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed p-2"
                    :disabled="excludingSeriesId === item.id"
                    title="Исключить из синхронизации">
              <svg v-if="excludingSeriesId === item.id" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Пустое состояние -->
      <div v-else-if="!initialLoading" class="text-center py-20 text-gray-500 bg-white rounded-lg shadow">
        <svg class="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <p class="text-xl">Сериалы не найдены</p>
        <p class="text-gray-400 mt-2">Попробуйте изменить параметры поиска</p>
      </div>

      <!-- Индикатор загрузки при скролле -->
      <div v-if="loadingMore" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>

      <!-- Сообщение о конце списка -->
      <div v-if="!hasMore && series.length > 0" class="text-center py-8 text-gray-500">
        Больше сериалов нет
      </div>
    </div>

    <!-- Модалка добавления/редактирования -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h2 class="text-xl font-bold mb-4">{{ showEditModal ? 'Редактировать сериал' : 'Добавить сериал' }}</h2>

          <form @submit.prevent="saveSeries">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-gray-700 text-sm font-bold mb-2">TMDB ID</label>
                <input v-model="seriesForm.tmdb_id" type="number" required
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div class="col-span-2">
                <label class="block text-gray-700 text-sm font-bold mb-2">Название</label>
                <input v-model="seriesForm.name" type="text" required
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div class="col-span-2">
                <label class="block text-gray-700 text-sm font-bold mb-2">Оригинальное название</label>
                <input v-model="seriesForm.original_name" type="text"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Первый эфир</label>
                <input v-model="seriesForm.first_air_date" type="date"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Последний эфир</label>
                <input v-model="seriesForm.last_air_date" type="date"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div class="col-span-2">
                <label class="block text-gray-700 text-sm font-bold mb-2">Описание</label>
                <textarea v-model="seriesForm.overview" rows="3"
                          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Количество сезонов</label>
                <input v-model="seriesForm.number_of_seasons" type="number" min="0"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Количество эпизодов</label>
                <input v-model="seriesForm.number_of_episodes" type="number" min="0"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Статус</label>
                <select v-model="seriesForm.status"
                        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="Returning Series">Returning Series</option>
                  <option value="Ended">Ended</option>
                  <option value="In Production">In Production</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Тип</label>
                <select v-model="seriesForm.type"
                        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="Scripted">Scripted</option>
                  <option value="Reality">Reality</option>
                  <option value="Documentary">Documentary</option>
                  <option value="News">News</option>
                  <option value="Talk Show">Talk Show</option>
                </select>
              </div>

              <div class="col-span-2">
                <label class="flex items-center">
                  <input v-model="seriesForm.in_production" type="checkbox"
                         class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                  <span class="ml-2 text-sm text-gray-700">В производстве</span>
                </label>
              </div>
            </div>

            <div class="flex justify-end space-x-2 mt-6">
              <button type="button" @click="closeModals"
                      class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
                Отмена
              </button>
              <button type="submit" :disabled="saving"
                      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50">
                {{ saving ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Модалка подтверждения удаления -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">Подтверждение удаления</h2>
        <p class="text-gray-600 mb-6">
          Вы уверены, что хотите удалить сериал "{{ selectedSeries?.name }}"?
          Это действие нельзя отменить.
        </p>
        <div class="flex justify-end space-x-2">
          <button @click="showDeleteModal = false"
                  class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
            Отмена
          </button>
          <button @click="deleteSeries" :disabled="deleting"
                  class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiClient } from '@/api/client';
import { adminApi } from '@/api/admin.client';
import { excludeApi } from "@/api/content.client.js";
import { debounce } from 'lodash-es';

const router = useRouter();
const route = useRoute();

// Состояние для бесконечной прокрутки
const series = ref([]);
const loading = ref(true);
const loadingMore = ref(false);
const initialLoading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const hasMore = ref(true);
const loadedPages = ref(1);

// Поиск и фильтры
const searchQuery = ref('');
const filterStatus = ref('');
const selectedSeries = ref(null);
const excludingSeriesId = ref(null);

// Модалки
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);

// Форма
const seriesForm = ref({
  tmdb_id: '',
  name: '',
  original_name: '',
  first_air_date: '',
  last_air_date: '',
  overview: '',
  number_of_seasons: 0,
  number_of_episodes: 0,
  status: 'Returning Series',
  type: 'Scripted',
  in_production: false
});

// ИНИЦИАЛИЗАЦИЯ ИЗ QUERY ПАРАМЕТРОВ
const initFromQuery = () => {
  const query = route.query;

  // Сбрасываем список сериалов
  series.value = [];
  currentPage.value = 1;
  loadedPages.value = 1;
  hasMore.value = true;

  if (query.search) {
    searchQuery.value = query.search;
  } else {
    searchQuery.value = '';
  }

  if (query.status) {
    filterStatus.value = query.status;
  } else {
    filterStatus.value = '';
  }
};

// ОБНОВЛЕНИЕ QUERY ПАРАМЕТРОВ
const updateQueryParams = () => {
  const query = {};

  if (searchQuery.value) {
    query.search = searchQuery.value;
  }

  if (filterStatus.value) {
    query.status = filterStatus.value;
  }

  router.replace({ query });
};

// Загрузка сериалов
const loadSeries = async (page = 1, append = false) => {
  if (!append) {
    loading.value = true;
    initialLoading.value = true;
  } else {
    loadingMore.value = true;
  }

  try {
    let response;

    if (searchQuery.value) {
      response = await apiClient.searchSeries(searchQuery.value, page);
    } else if (filterStatus.value === 'In Production') {
      response = await apiClient.getInProductionSeries(page);
    } else {
      response = await apiClient.getSeries(page);
    }

    if (response.success) {
      let newSeries = [];
      let pagination = { pages: 1 };

      if (response.data && Array.isArray(response.data)) {
        newSeries = response.data;
        pagination = response.pagination || { pages: 1 };
      } else if (response.data && response.data.data) {
        newSeries = response.data.data;
        pagination = response.data.pagination || { pages: 1 };
      } else if (Array.isArray(response)) {
        newSeries = response;
        pagination = { pages: 1 };
      }

      if (append) {
        series.value = [...series.value, ...newSeries];
      } else {
        series.value = newSeries;
      }

      totalPages.value = pagination.pages || 1;
      hasMore.value = page < totalPages.value;
      loadedPages.value = page;
    }
  } catch (error) {
    console.error('Error loading series:', error);
  } finally {
    loading.value = false;
    initialLoading.value = false;
    loadingMore.value = false;
  }
};

// Обработчики фильтров
const handleSearch = () => {
  currentPage.value = 1;
  filterStatus.value = '';
  updateQueryParams();
  loadSeries(1, false);
};

const debouncedSearch = debounce(() => {
  handleSearch();
}, 500);

const applyStatusFilter = () => {
  currentPage.value = 1;
  searchQuery.value = '';
  updateQueryParams();
  loadSeries(1, false);
};

const clearFilters = () => {
  searchQuery.value = '';
  filterStatus.value = '';
  currentPage.value = 1;
  updateQueryParams();
  loadSeries(1, false);
};

// Бесконечная прокрутка
const handleScroll = () => {
  if (loadingMore.value || !hasMore.value) return;

  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  if (scrollY + windowHeight >= documentHeight - 300) {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
      loadSeries(currentPage.value, true);
    }
  }
};

// Навигация
const goToSeriesDetails = (id) => {
  router.push(`/series/${id}`);
};

const manageSeasons = (item) => {
  router.push(`/admin/series/${item.id}/seasons`);
};

// CRUD операции
const editSeries = (item) => {
  selectedSeries.value = item;
  seriesForm.value = { ...item };
  showEditModal.value = true;
};

const confirmDelete = (item) => {
  selectedSeries.value = item;
  showDeleteModal.value = true;
};

const closeModals = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  seriesForm.value = {
    tmdb_id: '',
    name: '',
    original_name: '',
    first_air_date: '',
    last_air_date: '',
    overview: '',
    number_of_seasons: 0,
    number_of_episodes: 0,
    status: 'Returning Series',
    type: 'Scripted',
    in_production: false
  };
};

const saveSeries = async () => {
  saving.value = true;
  try {
    if (showEditModal.value) {
      // TODO: Обновление сериала
      // await adminApi.updateSeries(selectedSeries.value.id, seriesForm.value);
      console.log('Update series:', selectedSeries.value.id, seriesForm.value);
    } else {
      // TODO: Создание сериала
      // await adminApi.createSeries(seriesForm.value);
      console.log('Create series:', seriesForm.value);
    }
    closeModals();
    loadSeries(currentPage.value);
  } catch (error) {
    console.error('Error saving series:', error);
    alert('Ошибка при сохранении');
  } finally {
    saving.value = false;
  }
};

const deleteSeries = async () => {
  deleting.value = true;
  try {
    // TODO: Удаление сериала
    // await adminApi.deleteSeries(selectedSeries.value.id);
    console.log('Delete series:', selectedSeries.value.id);
    showDeleteModal.value = false;
    loadSeries(currentPage.value);
  } catch (error) {
    console.error('Error deleting series:', error);
    alert('Ошибка при удалении');
  } finally {
    deleting.value = false;
  }
};

// Метод исключения сериала - УПРОЩЕННАЯ ВЕРСИЯ
const excludeSeries = async (item) => {
  if (!item || !item.id) {
    alert('❌ Ошибка: некорректные данные сериала');
    return;
  }

  const seriesName = item?.name || item?.original_name || 'Неизвестный сериал';

  if (!confirm(`Вы уверены, что хотите исключить сериал "${seriesName}" из синхронизации?`)) {
    return;
  }

  excludingSeriesId.value = item.id;

  try {
    const response = await excludeApi.excludeSeries(item.id);

    if (response.success) {
      // Просто удаляем сериал из локального массива
      // Обратите внимание: здесь series, а не series.value
      series.value = series.value.filter(s => s.id !== item.id);
      alert('✅ Сериал успешно исключён из синхронизации');
    } else {
      throw new Error(response.message || 'Ошибка при исключении');
    }
  } catch (error) {
    console.error('Error excluding series:', error);
    alert(`❌ Ошибка: ${error.message}`);
  } finally {
    excludingSeriesId.value = null;
  }
};

// Следим за изменениями query параметров
watch(() => route.query, (newQuery) => {
  const shouldReload =
      (newQuery.search || '') !== searchQuery.value ||
      (newQuery.status || '') !== filterStatus.value;

  if (shouldReload) {
    initFromQuery();
    loadSeries(1, false);
  }
}, { deep: true });

// Инициализация
onMounted(() => {
  initFromQuery();
  loadSeries(1, false);
  window.addEventListener('scroll', handleScroll);
});

// Очистка
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.grid > div {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>