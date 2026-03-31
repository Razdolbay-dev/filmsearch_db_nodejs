<template>
  <div>
    <!-- Заголовок и поиск -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-4">
        {{ searchQuery ? `Поиск: "${searchQuery}"` : 'Фильмы' }}
      </h1>

      <div class="flex space-x-4">
        <input
            v-model="localSearchQuery"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="Поиск фильмов..."
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

      <!-- Фильтр по году -->
      <select
          v-model="filterYear"
          @change="applyYearFilter"
          class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      >
        <option value="">Все года</option>
        <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
      </select>

      <!-- Фильтр по жанру -->
      <select
          v-model="filterGenre"
          @change="applyGenreFilter"
          class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      >
        <option value="">Все жанры</option>
        <option v-for="genre in genres" :key="genre.id" :value="genre.id">{{ genre.name }}</option>
      </select>
    </div>

    <!-- Контент -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="movies.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <MovieCard
          v-for="movie in movies"
          :key="movie.id"
          :movie="movie"
          @view-details="goToMovieDetails"
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
      {{ searchQuery ? 'Ничего не найдено' : 'Нет доступных фильмов' }}
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
import MovieCard from '@/components/MovieCard.vue';
import Pagination from '@/components/Pagination.vue';
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
const movies = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const activeFilter = ref('all');
const localSearchQuery = ref(props.searchQuery);
const filterYear = ref('');
const filterGenre = ref('');

// Данные для фильтров
const years = ref([]);
const genres = ref([]);


const torrentSearchVisible = ref(false);
const torrentSearchQuery = ref('');
const torrentMediaType = ref('movie');
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
  // Можно показать уведомление или обновить список
  // После добавления торрента открываем детали
  if (result?.result?.hash) {
    selectedTorrentHash.value = result.result.hash;
    detailsModalVisible.value = true;
  }
};

// Вычисляемое свойство для отображения пагинации
const showPagination = computed(() => {
  return activeFilter.value !== 'popular';
});

// ** ВАЖНО: функция перехода на детальную страницу фильма **
const goToMovieDetails = (id) => {
  console.log('🎬 Переход к фильму:', id);
  router.push(`/movies/${id}`);
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

  // Восстанавливаем год
  if (query.year) {
    filterYear.value = query.year;
  }

  // Восстанавливаем жанр
  if (query.genre) {
    filterGenre.value = query.genre;
  }

  console.log('📌 Инициализация из URL:', {
    page: currentPage.value,
    search: localSearchQuery.value,
    filter: activeFilter.value,
    year: filterYear.value,
    genre: filterGenre.value
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

  if (filterYear.value) {
    query.year = filterYear.value;
  }

  if (filterGenre.value) {
    query.genre = filterGenre.value;
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
  localSearchQuery.value = '';
  filterYear.value = '';
  filterGenre.value = '';
  updateQueryParams();
  loadData();
};

// Загрузка данных в зависимости от состояния
const loadData = async () => {
  loading.value = true;

  try {
    let response;

    if (localSearchQuery.value) {
      // Поиск
      console.log('🔍 Поиск фильмов:', localSearchQuery.value);
      response = await apiClient.searchMovies(localSearchQuery.value, currentPage.value);
    } else if (filterYear.value) {
      // Фильтр по году
      console.log('📅 Фильтр по году:', filterYear.value);
      response = await apiClient.getMoviesByYear(filterYear.value, currentPage.value);
    } else if (filterGenre.value) {
      // Фильтр по жанру
      console.log('🎭 Фильтр по жанру:', filterGenre.value);
      response = await apiClient.getMoviesByGenre(filterGenre.value, currentPage.value);
    } else {
      switch (activeFilter.value) {
        case 'popular':
          response = await apiClient.getPopularMovies();
          break;
        default:
          response = await apiClient.getMovies(currentPage.value);
      }
    }

    console.log('📦 Загружены данные:', response);

    if (response.success) {
      if (activeFilter.value === 'popular') {
        movies.value = response.data || [];
        totalPages.value = 1;
      } else {
        movies.value = response.data.data || [];
        totalPages.value = response.data.pagination?.pages || 1;
      }
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки фильмов:', error);
  } finally {
    loading.value = false;
  }
};

// Загрузка данных для фильтров
const loadFilterData = async () => {
  try {
    // Здесь должен быть запрос на получение списка годов
    // Пока генерируем последние 20 лет
    const currentYear = new Date().getFullYear();
    years.value = Array.from({ length: 20 }, (_, i) => currentYear - i);

    // Здесь должен быть запрос на получение жанров
    // Пока заглушка
    genres.value = [
      { id: 28, name: 'Боевик' },
      { id: 12, name: 'Приключения' },
      { id: 16, name: 'Анимация' },
      { id: 35, name: 'Комедия' },
      { id: 80, name: 'Криминал' },
      { id: 99, name: 'Документальный' },
      { id: 18, name: 'Драма' },
      { id: 10751, name: 'Семейный' },
      { id: 14, name: 'Фэнтези' },
      { id: 36, name: 'История' },
      { id: 27, name: 'Ужасы' },
      { id: 10402, name: 'Музыка' },
      { id: 9648, name: 'Детектив' },
      { id: 10749, name: 'Мелодрама' },
      { id: 878, name: 'Фантастика' },
      { id: 10770, name: 'ТВ фильм' },
      { id: 53, name: 'Триллер' },
      { id: 10752, name: 'Военный' },
      { id: 37, name: 'Вестерн' }
    ];
  } catch (error) {
    console.error('❌ Ошибка загрузки данных для фильтров:', error);
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  filterYear.value = '';
  filterGenre.value = '';
  updateQueryParams();
  loadData();
};

const changePage = (page) => {
  currentPage.value = page;
  updateQueryParams();
  loadData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const applyYearFilter = () => {
  currentPage.value = 1;
  localSearchQuery.value = '';
  activeFilter.value = 'all';
  filterGenre.value = '';
  updateQueryParams();
  loadData();
};

const applyGenreFilter = () => {
  currentPage.value = 1;
  localSearchQuery.value = '';
  activeFilter.value = 'all';
  filterYear.value = '';
  updateQueryParams();
  loadData();
};

// Следим за изменениями маршрута
watch(() => route.query, (newQuery) => {
  console.log('🔍 Изменение query:', newQuery);
  initFromQuery();
  loadData();
}, { deep: true });

// Инициализация при монтировании
onMounted(async () => {
  await loadFilterData();
  initFromQuery();
  await loadData();
});
</script>