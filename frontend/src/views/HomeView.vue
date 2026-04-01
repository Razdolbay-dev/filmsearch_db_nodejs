<template>
  <div>
    <!-- Трендовые фильмы -->
    <section class="mb-12">
      <div class="flex justify-between items-center mb-6">
        <router-link to="/movies" class="text-blue-600 hover:text-blue-800 transition">
          Все фильмы →
        </router-link>
      </div>

      <div v-if="trendingMoviesLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="trendingMovies.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <MovieCard
            v-for="movie in trendingMovies"
            :key="movie.id"
            :movie="movie"
            @view-details="goToMovieDetails"
            @search-torrent="openTorrentSearch"
        />
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        <p>Нет трендовых фильмов в базе данных</p>
        <p class="text-sm mt-2 text-gray-400">
          Попробуйте позже или посмотрите
          <router-link to="/movies" class="text-blue-500">все фильмы</router-link>
        </p>
      </div>
    </section>

    <!-- Трендовые сериалы -->
    <section>
      <div class="flex justify-between items-center mb-6">
        <router-link to="/series" class="text-blue-600 hover:text-blue-800 transition">
          Все сериалы →
        </router-link>
      </div>

      <div v-if="trendingSeriesLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="trendingSeries.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <SeriesCard
            v-for="series in trendingSeries"
            :key="series.id"
            :series="series"
            @view-details="goToSeriesDetails"
            @search-torrent="openTorrentSearch"
        />
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        <p>Нет трендовых сериалов в базе данных</p>
        <p class="text-sm mt-2 text-gray-400">
          Попробуйте позже или посмотрите
          <router-link to="/series" class="text-blue-500">все сериалы</router-link>
        </p>
      </div>
    </section>

    <!-- Модальные окна -->
    <TorrentSearchModal
        :visible="torrentSearchVisible"
        :search-query="torrentSearchQuery"
        :media-type="torrentMediaType"
        :title="torrentTitle"
        :year="torrentYear"
        @close="torrentSearchVisible = false"
        @torrent-added="handleTorrentAdded"
    />

    <TorrentDetailsModal
        :visible="detailsModalVisible"
        :torrent-hash="selectedTorrentHash"
        @close="detailsModalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '@/api/client';
import MovieCard from '@/components/MovieCard.vue';
import SeriesCard from '@/components/SeriesCard.vue';
import TorrentDetailsModal from '@/components/TorrentDetailsModal.vue';
import TorrentSearchModal from '@/components/TorrentSearchModal.vue';

const router = useRouter();

// Состояние для трендовых фильмов
const trendingMovies = ref([]);
const trendingMoviesLoading = ref(true);
const trendingMoviesMetadata = ref(null);

// Состояние для трендовых сериалов
const trendingSeries = ref([]);
const trendingSeriesLoading = ref(true);
const trendingSeriesMetadata = ref(null);

// Состояние для модальных окон
const torrentSearchVisible = ref(false);
const torrentSearchQuery = ref('');
const torrentMediaType = ref('movie');
const torrentTitle = ref('');
const torrentYear = ref(null);

const detailsModalVisible = ref(false);
const selectedTorrentHash = ref('');

// Открытие поиска торрентов
const openTorrentSearch = (data) => {
  torrentSearchQuery.value = data.title;
  torrentMediaType.value = data.type;
  torrentTitle.value = data.title;
  torrentYear.value = data.year !== 'N/A' ? data.year : null;
  torrentSearchVisible.value = true;
};

// Обработка добавления торрента
const handleTorrentAdded = (result) => {
  console.log('Torrent added:', result);
  if (result?.result?.hash) {
    selectedTorrentHash.value = result.result.hash;
    detailsModalVisible.value = true;
  }
};

// Навигация
const goToMovieDetails = (id) => {
  router.push(`/movies/${id}`);
};

const goToSeriesDetails = (id) => {
  router.push(`/series/${id}`);
};

// Загрузка трендовых данных
const loadTrendingData = async () => {
  // Загружаем трендовые фильмы
  try {
    trendingMoviesLoading.value = true;
    const moviesResponse = await apiClient.getTrendingMovies(15, 'ru-RU');

    if (moviesResponse.success) {
      trendingMovies.value = moviesResponse.data || [];
      trendingMoviesMetadata.value = moviesResponse.metadata;
      console.log('Трендовые фильмы загружены:', {
        count: trendingMovies.value.length,
        metadata: moviesResponse.metadata
      });
    } else {
      console.error('Ошибка при загрузке фильмов:', moviesResponse.error);
      trendingMovies.value = [];
    }
  } catch (error) {
    console.error('Error loading trending movies:', error);
    trendingMovies.value = [];
  } finally {
    trendingMoviesLoading.value = false;
  }

  // Загружаем трендовые сериалы
  try {
    trendingSeriesLoading.value = true;
    const seriesResponse = await apiClient.getTrendingSeries(15, 'ru-RU');

    if (seriesResponse.success) {
      trendingSeries.value = seriesResponse.data || [];
      trendingSeriesMetadata.value = seriesResponse.metadata;
      console.log('Трендовые сериалы загружены:', {
        count: trendingSeries.value.length,
        metadata: seriesResponse.metadata
      });
    } else {
      console.error('Ошибка при загрузке сериалов:', seriesResponse.error);
      trendingSeries.value = [];
    }
  } catch (error) {
    console.error('Error loading trending series:', error);
    trendingSeries.value = [];
  } finally {
    trendingSeriesLoading.value = false;
  }
};

// Альтернативная версия с параллельной загрузкой (более производительная)
const loadTrendingDataParallel = async () => {
  try {
    trendingMoviesLoading.value = true;
    trendingSeriesLoading.value = true;

    const [moviesResponse, seriesResponse] = await Promise.all([
      apiClient.getTrendingMovies(15, 'ru-RU'),
      apiClient.getTrendingSeries(15, 'ru-RU')
    ]);

    if (moviesResponse.success) {
      trendingMovies.value = moviesResponse.data || [];
      trendingMoviesMetadata.value = moviesResponse.metadata;
    } else {
      trendingMovies.value = [];
    }

    if (seriesResponse.success) {
      trendingSeries.value = seriesResponse.data || [];
      trendingSeriesMetadata.value = seriesResponse.metadata;
    } else {
      trendingSeries.value = [];
    }

    console.log('Трендовые данные загружены:', {
      movies: trendingMovies.value.length,
      series: trendingSeries.value.length,
      moviesMetadata: trendingMoviesMetadata.value,
      seriesMetadata: trendingSeriesMetadata.value
    });

  } catch (error) {
    console.error('Error loading trending data:', error);
    trendingMovies.value = [];
    trendingSeries.value = [];
  } finally {
    trendingMoviesLoading.value = false;
    trendingSeriesLoading.value = false;
  }
};

// Используем параллельную загрузку для лучшей производительности
onMounted(() => {
  loadTrendingDataParallel();
});
</script>

<style scoped>
/* Анимации для карточек при загрузке */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>