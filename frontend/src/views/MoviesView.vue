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
          @click="loadMovies"
          class="px-4 py-2 rounded transition"
          :class="activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
      >
        Все
      </button>
      <button
          @click="loadPopular"
          class="px-4 py-2 rounded transition"
          :class="activeFilter === 'popular' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'"
      >
        Популярные
      </button>
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
      />
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      {{ searchQuery ? 'Ничего не найдено' : 'Нет доступных фильмов' }}
    </div>

    <!-- Пагинация -->
    <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="changePage"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiClient } from '../api/client';
import MovieCard from '../components/MovieCard.vue';
import Pagination from '../components/Pagination.vue';

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

const goToMovieDetails = (id) => {
  router.push(`/movies/${id}`);
};

const loadMovies = async (page = 1) => {
  loading.value = true;
  activeFilter.value = 'all';

  try {
    const response = await apiClient.getMovies(page);
    movies.value = response.data.data || [];
    totalPages.value = response.data.pagination?.pages || 1;
    currentPage.value = page;
  } catch (error) {
    console.error('Error loading movies:', error);
  } finally {
    loading.value = false;
  }
};

const loadPopular = async () => {
  loading.value = true;
  activeFilter.value = 'popular';

  try {
    const response = await apiClient.getPopularMovies();
    movies.value = response.data || [];
    totalPages.value = 1;
  } catch (error) {
    console.error('Error loading popular movies:', error);
  } finally {
    loading.value = false;
  }
};

const searchMovies = async (page = 1) => {
  if (!localSearchQuery.value.trim()) {
    loadMovies();
    return;
  }

  loading.value = true;

  try {
    const response = await apiClient.searchMovies(localSearchQuery.value, page);
    movies.value = response.data.data || [];
    totalPages.value = response.data.pagination?.pages || 1;
    currentPage.value = page;

    // Обновляем URL
    router.push({ query: { q: localSearchQuery.value } });
  } catch (error) {
    console.error('Error searching movies:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  searchMovies(1);
};

const changePage = (page) => {
  if (activeFilter.value === 'popular') return;

  if (localSearchQuery.value) {
    searchMovies(page);
  } else {
    loadMovies(page);
  }

  // Прокрутка вверх
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Загрузка при монтировании
onMounted(() => {
  if (props.searchQuery) {
    localSearchQuery.value = props.searchQuery;
    searchMovies(1);
  } else {
    loadMovies(1);
  }
});

// Следим за изменением searchQuery из URL
watch(() => props.searchQuery, (newQuery) => {
  if (newQuery) {
    localSearchQuery.value = newQuery;
    searchMovies(1);
  }
});
</script>