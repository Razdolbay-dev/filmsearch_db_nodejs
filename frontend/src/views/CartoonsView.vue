<template>
  <div>
    <!-- Заголовок и поиск -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4">
        {{ searchQuery ? `Поиск: "${searchQuery}"` : 'Мультфильмы' }}
      </h1>

      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 flex space-x-4">
          <input
              v-model="localSearchQuery"
              @keyup.enter="handleSearch"
              type="text"
              placeholder="Поиск мультфильмов..."
              class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
              @click="handleSearch"
              class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Найти
          </button>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="mb-6 flex flex-wrap gap-2">
      <button
          @click="setFilter('all')"
          class="px-4 py-2 rounded transition"
          :class="activeFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
      >
        Все
      </button>
      <button
          @click="setFilter('popular')"
          class="px-4 py-2 rounded transition"
          :class="activeFilter === 'popular' ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
      >
        Популярные
      </button>
      <button
          @click="setFilter('movies')"
          class="px-4 py-2 rounded transition"
          :class="activeFilter === 'movies' ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
      >
        🎬 Только фильмы
      </button>
      <button
          @click="setFilter('series')"
          class="px-4 py-2 rounded transition"
          :class="activeFilter === 'series' ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
      >
        📺 Только сериалы
      </button>

      <!-- Фильтр по году -->
      <select
          v-model="filterYear"
          @change="applyYearFilter"
          class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
      >
        <option value="">Все года</option>
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>
    </div>

    <!-- Статистика -->
    <div v-if="stats && !loading" class="mb-4 text-sm text-gray-600">
      Найдено: {{ stats.movies }} фильмов и {{ stats.series }} сериалов
    </div>

    <!-- Контент -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <div v-else-if="cartoons.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <CartoonCard
          v-for="item in cartoons"
          :key="`${item.type}-${item.id}`"
          :cartoon="item"
          @view-details="goToDetails"
      />
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      {{ searchQuery ? 'Ничего не найдено' : 'Нет доступных мультфильмов' }}
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
import { cartoonsApi } from '../api/cartoons.client';
import CartoonCard from '../components/CartoonCard.vue';
import Pagination from '../components/Pagination.vue';
import { debounce } from 'lodash-es';

const router = useRouter();
const route = useRoute();

// Состояние
const cartoons = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const searchQuery = ref('');
const localSearchQuery = ref('');
const activeFilter = ref('all');
const filterYear = ref('');
const stats = ref(null);

// Данные для фильтров
const years = ref([]);

// Вычисляемое свойство для отображения пагинации
const showPagination = computed(() => {
  return activeFilter.value !== 'popular';
});

// Инициализация из URL параметров
const initFromQuery = () => {
  const query = route.query;

  if (query.page) {
    currentPage.value = parseInt(query.page);
  } else {
    currentPage.value = 1;
  }

  if (query.search) {
    searchQuery.value = query.search;
    localSearchQuery.value = query.search;
  } else {
    searchQuery.value = '';
    localSearchQuery.value = '';
  }

  if (query.filter) {
    activeFilter.value = query.filter;
  } else {
    activeFilter.value = 'all';
  }

  if (query.year) {
    filterYear.value = query.year;
  } else {
    filterYear.value = '';
  }

  console.log('📌 Cartoons: инициализация из URL:', {
    page: currentPage.value,
    search: searchQuery.value,
    filter: activeFilter.value,
    year: filterYear.value
  });
};

// Обновление URL параметров
const updateQueryParams = () => {
  const query = {};

  if (currentPage.value > 1) {
    query.page = currentPage.value;
  }

  if (searchQuery.value) {
    query.search = searchQuery.value;
  }

  if (activeFilter.value !== 'all') {
    query.filter = activeFilter.value;
  }

  if (filterYear.value) {
    query.year = filterYear.value;
  }

  console.log('🔄 Cartoons: обновление URL:', query);

  router.replace({ query });
};

// Загрузка данных
const loadData = async () => {
  loading.value = true;

  try {
    let response;

    if (searchQuery.value) {
      // Поиск
      response = await cartoonsApi.searchCartoons(searchQuery.value, currentPage.value);
    } else if (filterYear.value) {
      // Фильтр по году
      response = await cartoonsApi.getCartoonsByYear(filterYear.value, currentPage.value);
    } else {
      switch (activeFilter.value) {
        case 'popular':
          response = await cartoonsApi.getPopularCartoons();
          break;
        case 'movies':
          // Используем фильтр по типу 'movies'
          response = await cartoonsApi.getCartoonsByType('movies', currentPage.value);
          break;
        case 'series':
          // Используем фильтр по типу 'series'
          response = await cartoonsApi.getCartoonsByType('series', currentPage.value);
          break;
        default:
          // Все типы
          response = await cartoonsApi.getAllCartoons(currentPage.value);
      }
    }

    console.log('📦 Cartoons response:', response);

    if (response.success) {
      if (activeFilter.value === 'popular') {
        cartoons.value = response.data || [];
        totalPages.value = 1;
        stats.value = null;
      } else {
        cartoons.value = response.data.data || [];
        totalPages.value = response.data.pagination?.pages || 1;
        stats.value = response.data.stats || null;
      }
    }
  } catch (error) {
    console.error('❌ Error loading cartoons:', error);
  } finally {
    loading.value = false;
  }
};

// Загрузка годов для фильтра
const loadYears = () => {
  const currentYear = new Date().getFullYear();
  years.value = Array.from({ length: 30 }, (_, i) => currentYear - i);
};

// Обработчики
const goToDetails = (id, type) => {
  if (type === 'movie') {
    router.push(`/movies/${id}`);
  } else {
    router.push(`/series/${id}`);
  }
};

// Обработчик смены фильтра
const setFilter = (filter) => {
  activeFilter.value = filter;
  currentPage.value = 1;
  searchQuery.value = '';
  localSearchQuery.value = '';
  filterYear.value = '';
  updateQueryParams();
  loadData();
};

const handleSearch = debounce(() => {
  if (localSearchQuery.value) {
    searchQuery.value = localSearchQuery.value;
    activeFilter.value = 'all';
    filterYear.value = '';
    currentPage.value = 1;
    updateQueryParams();
    loadData();
  } else if (searchQuery.value) {
    // Очистка поиска
    searchQuery.value = '';
    updateQueryParams();
    loadData();
  }
}, 500);

const applyYearFilter = () => {
  if (filterYear.value) {
    searchQuery.value = '';
    localSearchQuery.value = '';
    activeFilter.value = 'all';
    currentPage.value = 1;
    updateQueryParams();
    loadData();
  }
};

const changePage = (page) => {
  currentPage.value = page;
  updateQueryParams();
  loadData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Следим за изменениями query
watch(() => route.query, () => {
  initFromQuery();
  loadData();
}, { deep: true });

// Инициализация
onMounted(() => {
  loadYears();
  initFromQuery();
  loadData();
});
</script>