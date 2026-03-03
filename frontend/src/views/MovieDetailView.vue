<template>
  <div v-if="loading" class="flex justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>

  <div v-else-if="movie" class="max-w-6xl mx-auto">
    <!-- Бэкдроп
    <div
        v-if="movie.backdrop_path"
        class="relative h-96 rounded-lg overflow-hidden mb-8"
    >
      <img
          :src="`https://image.tmdb.org/t/p/original${movie.backdrop_path}`"
          :alt="movie.title"
          class="w-full h-full object-cover"
          @error="handleBackdropError"
      />

      <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent">


      </div>

    </div> -->

    <!-- Основная информация -->
    <div class="flex flex-col md:flex-row gap-8">
      <!-- Постер -->
      <div class="md:w-1/3">
        <img
            v-if="movie.poster_path"
            :src="`images/posters${movie.poster_path}`"
            :alt="movie.title"
            class="w-full rounded-lg shadow-lg"
            @error="handlePosterError"
        />
        <div v-else class="w-full aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center">
          <span class="text-gray-400">Нет постера</span>
        </div>
        <button
            class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          СМОТРЕТЬ
        </button>
      </div>

      <!-- Детали -->
      <div class="md:w-2/3">
        <h1 class="text-4xl font-bold mb-2">{{ movie.title }}</h1>
        <p class="text-gray-600 text-lg mb-4">{{ movie.original_title }}</p>
        <p v-if="movie.tagline" class="text-gray-600 text-lg mb-4">{{ movie.tagline }}</p>

        <div class="flex flex-wrap gap-4 mb-6">
          <span class="px-3 py-1 bg-yellow-400 rounded-full font-semibold">
            Рейтинг: {{ formatVoteAverage(movie.vote_average) }}
          </span>
          <span class="px-3 py-1 bg-gray-200 rounded-full">
            {{ formatYear(movie.release_date) }}
          </span>
          <span class="px-3 py-1 bg-gray-200 rounded-full">
            {{ formatRuntime(movie.runtime) }}
          </span>
          <span class="px-3 py-1 ">
            IMDB: <span class="px-3 py-1 bg-gray-200 rounded-full">
            {{ movie.imdb_id }}
            </span>
          </span>
          <span v-if="movie.adult" class="px-3 py-1 bg-red-200 text-red-800 rounded-full">
            18+
          </span>
        </div>

        <div v-if="movie.genres && movie.genres.length" class="mb-6">
          <h2 class="text-xl font-semibold mb-2">Жанры</h2>
          <div class="flex flex-wrap gap-2">
            <span
                v-for="genre in movie.genres"
                :key="genre.id"
                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {{ genre.name }}
            </span>
          </div>
        </div>

        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-2">О фильме</h2>
          <p class="text-gray-700 leading-relaxed">{{ movie.overview || 'Нет описания' }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div v-if="movie.production_companies && movie.production_companies.length">
            <h3 class="font-semibold mb-2">Производство</h3>
            <p class="text-gray-600">{{ formatCompanies(movie.production_companies) }}</p>
          </div>

          <div v-if="movie.production_countries && movie.production_countries.length">
            <h3 class="font-semibold mb-2">Страны</h3>
            <p class="text-gray-600">{{ formatCountries(movie.production_countries) }}</p>
          </div>

          <div v-if="movie.spoken_languages && movie.spoken_languages.length">
            <h3 class="font-semibold mb-2">Языки</h3>
            <p class="text-gray-600">{{ formatLanguages(movie.spoken_languages) }}</p>
          </div>

          <div>
            <h3 class="font-semibold mb-2">Бюджет</h3>
            <p class="text-gray-600">{{ formatCurrency(movie.budget) }}</p>
          </div>

          <div>
            <h3 class="font-semibold mb-2">Сборы</h3>
            <p class="text-gray-600">{{ formatCurrency(movie.revenue) }}</p>
          </div>


        </div>

        <div v-if="movie.homepage" class="mb-6">
          <a
              :href="movie.homepage"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:underline inline-flex items-center"
          >
            Официальный сайт
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

        </div>

        <!-- Отладка (только в разработке) -->
        <div v-if="showDebug" class="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 class="font-semibold mb-2">Отладочная информация:</h3>
          <pre class="text-xs overflow-auto max-h-96">{{ JSON.stringify(movie, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12 text-gray-500">
    Фильм не найден
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { apiClient } from '../api/client';
import {
  formatVoteAverage,
  formatYear,
  formatRuntime,
  formatCurrency
} from '../utils/formatters';

const route = useRoute();
const movie = ref(null);
const loading = ref(true);
const showDebug = import.meta.env.DEV; // Показывать отладку только в разработке

// Форматирование компаний
const formatCompanies = (companies) => {
  if (!companies || !companies.length) return 'N/A';
  return companies.map(c => c.name).join(', ');
};

// Форматирование стран
const formatCountries = (countries) => {
  if (!countries || !countries.length) return 'N/A';
  return countries.map(c => c.name || c.iso_code).join(', ');
};

// Форматирование языков
const formatLanguages = (languages) => {
  if (!languages || !languages.length) return 'N/A';
  return languages.map(l => l.english_name || l.name).join(', ');
};

// Обработчики ошибок изображений
const handleBackdropError = (e) => {
  e.target.style.display = 'none';
};

const handlePosterError = (e) => {
  e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
};

onMounted(async () => {
  try {
    console.log('🎬 Загружаем фильм с ID:', route.params.id);

    const response = await apiClient.getMovieById(route.params.id);
    console.log('📦 Ответ от API:', response);

    if (response.success && response.data) {
      movie.value = response.data;
      console.log('✅ Фильм загружен:', movie.value);
    } else {
      console.error('❌ Ошибка в ответе API:', response);
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки фильма:', error);
  } finally {
    loading.value = false;
  }
});
</script>