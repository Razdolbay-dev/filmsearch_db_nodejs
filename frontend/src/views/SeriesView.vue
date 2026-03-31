<template>
  <div>
    <!-- Заголовок и поиск -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4">
        {{ searchQuery ? `Поиск: "${searchQuery}"` : 'Сериалы' }}
      </h1>

      <div class="flex space-x-4">
        <input
            v-model="localSearchQuery"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="Поиск сериалов..."
            class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
            @click="handleSearch"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Найти
        </button>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="mb-6 flex flex-wrap gap-2">
      <button
          @click="setFilter('all')"
          class="px-4 py-2 rounded transition"
          :class="activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
      >
        Все
      </button>
      <button
          @click="setFilter('popular')"
          class="px-4 py-2 rounded transition"
          :class="activeFilter === 'popular' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
      >
        Популярные
      </button>
      <button
          @click="setFilter('production')"
          class="px-4 py-2 rounded transition"
          :class="activeFilter === 'production' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
      >
        В производстве
      </button>
    </div>

    <!-- Контент -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="series.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <SeriesCard
          v-for="item in series"
          :key="item.id"
          :series="item"
          @view-details="goToSeriesDetails"
          @search-torrent="openTorrentSearch"
      />
      <!-- Модальное окно поиска торрентов -->
      <TorrentSearchModal
          :visible="torrentSearchVisible"
          :search-query="torrentSearchQuery"
          :media-type="torrentMediaType"
          :title="torrentTitle"
          :year="torrentYear"
          @close="torrentSearchVisible = false"
          @torrent-added="handleTorrentAdded"
      />
      <!-- После добавления торрента показываем детали -->
      <TorrentDetailsModal
          :visible="detailsModalVisible"
          :torrent-hash="selectedTorrentHash"
          @close="detailsModalVisible = false"
      />
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      {{ searchQuery ? 'Ничего не найдено' : 'Нет доступных сериалов' }}
    </div>

    <!-- Пагинация -->
    <Pagination
        v-if="totalPages > 1 && showPagination"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="changePage"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiClient } from '@/api/client';
import SeriesCard from '../components/SeriesCard.vue';
import Pagination from '../components/Pagination.vue';
import TorrentSearchModal from '@/components/TorrentSearchModal.vue';
import TorrentDetailsModal from '@/components/TorrentDetailsModal.vue'

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
});

const router = useRouter();
const route = useRoute();
const series = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const activeFilter = ref('all');
const localSearchQuery = ref('');

// Вычисляемое свойство для отображения пагинации
const showPagination = computed(() => {
  return activeFilter.value !== 'popular' && activeFilter.value !== 'production';
});

const torrentSearchVisible = ref(false);
const torrentSearchQuery = ref('');
const torrentMediaType = ref('series');
const torrentTitle = ref('');
const torrentYear = ref(null);

const detailsModalVisible = ref(false);
const selectedTorrentHash = ref('');


const openTorrentSearch = (data) => {
  torrentSearchQuery.value = data.title;
  torrentMediaType.value = data.type;
  torrentTitle.value = data.title;
  torrentYear.value = data.year !== 'N/A' ? data.year : null;
  torrentSearchVisible.value = true;
};

const handleTorrentAdded = (result) => {
  console.log('Torrent added:', result);
  // После добавления торрента открываем детали
  if (result?.result?.hash) {
    selectedTorrentHash.value = result.result.hash;
    detailsModalVisible.value = true;
  }
};

// Инициализация из URL параметров
const initFromQuery = () => {
  const query = route.query;

  // Восстанавливаем страницу
  if (query.page) {
    currentPage.value = parseInt(query.page);
  }

  // Восстанавливаем поиск
  if (query.search) {
    localSearchQuery.value = query.search;
  }

  // Восстанавливаем фильтр
  if (query.filter) {
    activeFilter.value = query.filter;
  }

  console.log('📌 Инициализация из URL:', {
    page: currentPage.value,
    search: localSearchQuery.value,
    filter: activeFilter.value
  });
};

// Обновление URL с параметрами
const updateQueryParams = () => {
  const query = {};

  if (currentPage.value > 1) {
    query.page = currentPage.value;
  }

  if (localSearchQuery.value) {
    query.search = localSearchQuery.value;
  }

  if (activeFilter.value !== 'all') {
    query.filter = activeFilter.value;
  }

  console.log('🔄 Обновление URL:', query);

  router.replace({
    query: query
  });
};

// Установка фильтра
const setFilter = (filter) => {
  activeFilter.value = filter;
  currentPage.value = 1;
  localSearchQuery.value = ''; // Очищаем поиск при смене фильтра
  updateQueryParams();
  loadData();
};

const goToSeriesDetails = (id) => {
  router.push(`/series/${id}`);
};

// Загрузка данных в зависимости от состояния
const loadData = async () => {
  loading.value = true;

  try {
    let response;

    if (localSearchQuery.value) {
      // Поиск
      response = await apiClient.searchSeries(localSearchQuery.value, currentPage.value);
    } else {
      switch (activeFilter.value) {
        case 'popular':
          response = await apiClient.getPopularSeries();
          break;
        case 'production':
          response = await apiClient.getInProductionSeries(currentPage.value);
          break;
        default:
          response = await apiClient.getSeries(currentPage.value);
      }
    }

    console.log('📦 Загружены данные:', response);

    if (response.success) {
      if (activeFilter.value === 'popular') {
        series.value = response.data || [];
        totalPages.value = 1;
      } else {
        series.value = response.data.data || [];
        totalPages.value = response.data.pagination?.pages || 1;
      }
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  updateQueryParams();
  loadData();
};

const changePage = (page) => {
  currentPage.value = page;
  updateQueryParams();
  loadData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Следим за изменениями маршрута
watch(() => route.query, (newQuery) => {
  console.log('🔍 Изменение query:', newQuery);
  initFromQuery();
  loadData();
}, { deep: true });

// Инициализация при монтировании
onMounted(() => {
  initFromQuery();
  loadData();
});
</script>