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

    <!-- Поиск и фильтры (аналогично MoviesView) -->
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
          <select v-model="filterStatus" class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Все статусы</option>
            <option value="Returning Series">Возвращается</option>
            <option value="Ended">Завершен</option>
            <option value="In Production">В производстве</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Таблица сериалов -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="series.length" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Постер</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Годы</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сезонов</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Рейтинг</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
          <tr v-for="item in series" :key="item.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-500">{{ item.id }}</td>
            <td class="px-6 py-4">
              <img v-if="item.poster_path"
                   :src="`https://image.tmdb.org/t/p/w92${item.poster_path}`"
                   class="w-12 h-16 object-cover rounded">
              <div v-else class="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="font-medium">{{ item.name }}</div>
              <div class="text-sm text-gray-500">{{ item.original_name }}</div>
            </td>
            <td class="px-6 py-4 text-sm">
              {{ item.first_air_date?.split('-')[0] || 'N/A' }} -
              {{ item.last_air_date?.split('-')[0] || 'н.в.' }}
            </td>
            <td class="px-6 py-4 text-sm">{{ item.number_of_seasons || 0 }}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm"
                      :class="{
                        'bg-green-100 text-green-800': item.status === 'Returning Series',
                        'bg-gray-100 text-gray-800': item.status === 'Ended',
                        'bg-blue-100 text-blue-800': item.status === 'In Production'
                      }">
                  {{ item.status || 'N/A' }}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                  ★ {{ Number(item.vote_average).toFixed(1) }}
                </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex space-x-2">
                <button @click="editSeries(item)" class="text-blue-600 hover:text-blue-800">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="manageSeasons(item)" class="text-green-600 hover:text-green-800">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button @click="confirmDelete(item)" class="text-red-600 hover:text-red-800">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

        <!-- Пагинация -->
        <div class="px-6 py-4 border-t">
          <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="changePage"
          />
        </div>
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        Сериалы не найдены
      </div>
    </div>

    <!-- Модалки (аналогично MoviesView) -->
    <!-- ... модалки добавления/редактирования/удаления ... -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiClient } from '@/api/client';
import { adminApi } from '@/api/admin.client';
import Pagination from '@/components/Pagination.vue';
import { debounce } from 'lodash-es';

const router = useRouter();
const route = useRoute();

// Состояние
const series = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const searchQuery = ref('');
const filterStatus = ref('');
const selectedSeries = ref(null);

// Модалки
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const saving = ref(false);
const deleting = ref(false);

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

// ** ИНИЦИАЛИЗАЦИЯ ИЗ QUERY ПАРАМЕТРОВ **
const initFromQuery = () => {
  const query = route.query;

  // Восстанавливаем страницу
  if (query.page) {
    currentPage.value = parseInt(query.page);
  } else {
    currentPage.value = 1;
  }

  // Восстанавливаем поиск
  if (query.search) {
    searchQuery.value = query.search;
  } else {
    searchQuery.value = '';
  }

  // Восстанавливаем фильтр по статусу
  if (query.status) {
    filterStatus.value = query.status;
  } else {
    filterStatus.value = '';
  }

  console.log('📌 Series: инициализация из URL:', {
    page: currentPage.value,
    search: searchQuery.value,
    status: filterStatus.value
  });
};

// ** ОБНОВЛЕНИЕ QUERY ПАРАМЕТРОВ **
const updateQueryParams = () => {
  const query = {};

  if (currentPage.value > 1) {
    query.page = currentPage.value;
  }

  if (searchQuery.value) {
    query.search = searchQuery.value;
  }

  if (filterStatus.value) {
    query.status = filterStatus.value;
  }

  console.log('🔄 Series: обновление URL:', query);

  router.replace({ query });
};

// Загрузка сериалов
const loadSeries = async (page = currentPage.value) => {
  loading.value = true;
  try {
    let response;

    if (searchQuery.value) {
      // Поиск
      response = await apiClient.searchSeries(searchQuery.value, page);
    } else if (filterStatus.value === 'popular') {
      // Популярные
      response = await apiClient.getPopularSeries();
    } else if (filterStatus.value === 'production') {
      // В производстве
      response = await apiClient.getInProductionSeries(page);
    } else {
      // Все сериалы
      response = await apiClient.getSeries(page);
    }

    if (response.success) {
      if (filterStatus.value === 'popular') {
        series.value = response.data || [];
        totalPages.value = 1;
      } else {
        series.value = response.data.data || [];
        totalPages.value = response.data.pagination?.pages || 1;
      }
      currentPage.value = page;
    }
  } catch (error) {
    console.error('Error loading series:', error);
  } finally {
    loading.value = false;
  }
};

// Обработчики
const goToSeriesDetails = (id) => {
  router.push(`/series/${id}`);
};

const handleSearch = debounce(() => {
  currentPage.value = 1;
  filterStatus.value = '';
  updateQueryParams();
  loadSeries(1);
}, 500);

const setFilter = (filter) => {
  filterStatus.value = filter;
  currentPage.value = 1;
  searchQuery.value = '';
  updateQueryParams();
  loadSeries(1);
};

const clearFilters = () => {
  searchQuery.value = '';
  filterStatus.value = '';
  currentPage.value = 1;
  updateQueryParams();
  loadSeries(1);
};

const changePage = (page) => {
  currentPage.value = page;
  updateQueryParams();
  loadSeries(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// CRUD операции
const editSeries = (item) => {
  selectedSeries.value = item;
  seriesForm.value = { ...item };
  showEditModal.value = true;
};

const manageSeasons = (item) => {
  router.push(`/admin/series/${item.id}/seasons`);
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

// Следим за изменениями query параметров
watch(() => route.query, (newQuery) => {
  console.log('🔍 Series: изменение query:', newQuery);
  initFromQuery();
  loadSeries(currentPage.value);
}, { deep: true });

// Инициализация при монтировании
onMounted(() => {
  initFromQuery();
  loadSeries(currentPage.value);
});
</script>