<template>
  <div>
    <!-- Hero секция -->
    <section class="text-center py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg mb-12">
      <h1 class="text-5xl font-bold mb-4">TMDB Explorer</h1>
      <p class="text-xl opacity-90">Исследуйте мир кино и сериалов</p>
    </section>

    <!-- Популярные фильмы -->
    <section class="mb-12">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Популярные фильмы</h2>
        <router-link to="/movies" class="text-blue-600 hover:text-blue-800 transition">
          Все фильмы →
        </router-link>
      </div>

      <div v-if="popularMoviesLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="popularMovies.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <MovieCard
            v-for="movie in popularMovies"
            :key="movie.id"
            :movie="movie"
            @view-details="goToMovieDetails"
        />
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        Нет доступных фильмов
      </div>
    </section>

    <!-- Популярные сериалы -->
    <section>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Популярные сериалы</h2>
        <router-link to="/series" class="text-blue-600 hover:text-blue-800 transition">
          Все сериалы →
        </router-link>
      </div>

      <div v-if="popularSeriesLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="popularSeries.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <SeriesCard
            v-for="series in popularSeries"
            :key="series.id"
            :series="series"
            @view-details="goToSeriesDetails"
        />
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        Нет доступных сериалов
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../api/client';
import MovieCard from '../components/MovieCard.vue';
import SeriesCard from '../components/SeriesCard.vue';

const router = useRouter();
const popularMovies = ref([]);
const popularSeries = ref([]);
const popularMoviesLoading = ref(true);
const popularSeriesLoading = ref(true);

const goToMovieDetails = (id) => {
  router.push(`/movies/${id}`);
};

const goToSeriesDetails = (id) => {
  router.push(`/series/${id}`);
};

onMounted(async () => {
  try {
    const moviesResponse = await apiClient.getPopularMovies(10);
    popularMovies.value = moviesResponse.data || [];
  } catch (error) {
    console.error('Error loading popular movies:', error);
  } finally {
    popularMoviesLoading.value = false;
  }

  try {
    const seriesResponse = await apiClient.getPopularSeries(10);
    popularSeries.value = seriesResponse.data || [];
  } catch (error) {
    console.error('Error loading popular series:', error);
  } finally {
    popularSeriesLoading.value = false;
  }
});
</script>