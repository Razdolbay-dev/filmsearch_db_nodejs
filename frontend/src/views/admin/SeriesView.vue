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
                   :src="`/images/posters${item.poster_path}`"
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
                <!-- Кнопка исключения сериала -->
                <button @click="excludeSeries(item)"
                        class="text-orange-600 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="excludingSeriesId === item.id"
                        title="Исключить из синхронизации (добавить в blacklist)">
                  <svg v-if="excludingSeriesId === item.id" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
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
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiClient } from '@/api/client';
import { adminApi } from '@/api/admin.client';
import Pagination from '@/components/Pagination.vue';
import { debounce } from 'lodash-es';
import { excludeApi } from "@/api/content.client.js";

const router = useRouter();
const route = useRoute();

// Состояние
const series = ref([]);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
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
      console.log('🔍 Поиск сериалов:', searchQuery.value);
      response = await apiClient.searchSeries(searchQuery.value, page);
    } else if (filterStatus.value === 'In Production') {
      // В производстве
      console.log('🎬 Фильтр: в производстве');
      response = await apiClient.getInProductionSeries(page);
    } else if (filterStatus.value) {
      // Фильтр по статусу (если API поддерживает)
      console.log('📋 Фильтр по статусу:', filterStatus.value);
      // Если API не поддерживает фильтр по статусу, показываем все
      response = await apiClient.getSeries(page);
    } else {
      // Все сериалы
      console.log('📋 Все сериалы, страница:', page);
      response = await apiClient.getSeries(page);
    }

    console.log('📦 Ответ от API:', response);

    if (response.success) {
      // Обрабатываем разные форматы ответа
      if (response.data && Array.isArray(response.data)) {
        series.value = response.data;
        totalPages.value = response.pagination?.pages || 1;
      } else if (response.data && response.data.data) {
        series.value = response.data.data;
        totalPages.value = response.data.pagination?.pages || 1;
      } else if (Array.isArray(response)) {
        series.value = response;
        totalPages.value = 1;
      } else {
        series.value = [];
        totalPages.value = 1;
      }
      currentPage.value = page;
    } else {
      console.error('Ответ API не содержит success: true');
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

// Исправленный handleSearch
const handleSearch = () => {
  currentPage.value = 1;
  filterStatus.value = '';
  updateQueryParams();
  loadSeries(1);
};

const debouncedSearch = debounce(() => {
  handleSearch();
}, 500);

// Исправленный applyStatusFilter
const applyStatusFilter = () => {
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

// Метод исключения сериала
const excludeSeries = async (series) => {
  // Спрашиваем подтверждение
  const confirmed = await new Promise((resolve) => {
    if (confirm(`Вы уверены, что хотите исключить сериал "${series.name}" из синхронизации?\n\nЭто действие:\n• Удалит сериал из базы данных\n• Удалит все сезоны и эпизоды\n• Добавит его TMDB ID в blacklist\n• При следующей синхронизации он не загрузится`)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });

  if (!confirmed) return;

  // Устанавливаем ID исключаемого сериала для отображения спиннера
  excludingSeriesId.value = series.id;

  try {
    const response = await excludeApi.excludeSeries(series.id);

    if (response.success) {
      // Просто показываем сообщение об успехе
      alert('✅ Сериал успешно исключён из синхронизации');

      // Перезагружаем список
      await loadSeries(currentPage.value);
    } else {
      throw new Error(response.message || 'Ошибка при исключении');
    }
  } catch (error) {
    console.error('Error excluding series:', error);
    alert(`❌ Ошибка: ${error.message}`);
  } finally {
    // Сбрасываем ID исключаемого сериала
    excludingSeriesId.value = null;
  }
};

// Следим за изменениями query параметров
watch(() => route.query, (newQuery) => {
  console.log('🔍 Series: изменение query:', newQuery);

  // Проверяем, нужно ли перезагружать данные
  const shouldReload =
      String(newQuery.page || '1') !== String(currentPage.value) ||
      (newQuery.search || '') !== searchQuery.value ||
      (newQuery.status || '') !== filterStatus.value;

  if (shouldReload) {
    initFromQuery();
    loadSeries(currentPage.value);
  }
}, { deep: true });

// Инициализация при монтировании
onMounted(() => {
  initFromQuery();
  loadSeries(currentPage.value);
});
</script>