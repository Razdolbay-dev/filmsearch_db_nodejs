<template>
  <div v-if="loading" class="flex justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>

  <div v-else-if="series" class="max-w-6xl mx-auto">
    <!-- Бэкдроп
    <div
        v-if="series.backdrop_path"
        class="relative h-96 rounded-lg overflow-hidden mb-8"
    >
      <img
          :src="`https://image.tmdb.org/t/p/original${series.backdrop_path}`"
          :alt="series.name"
          class="w-full h-full object-cover"
          @error="handleBackdropError"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
    </div> -->

    <!-- Основная информация -->
    <div class="flex flex-col md:flex-row gap-8">
      <!-- Постер -->
      <div class="md:w-1/3">
        <img
            v-if="series.poster_path && !showPosterPlaceholder"
            :src="currentPosterUrl"
            :alt="series.name"
            class="w-full rounded-lg shadow-lg"
            @error="handlePosterError"
            @load="handlePosterLoad"
        />
        <div
            v-else
            class="w-full aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center"
        >
          <span class="text-gray-400">Нет постера</span>
        </div>
      </div>

      <!-- Детали -->
      <div class="md:w-2/3">
        <h1 class="text-4xl font-bold mb-2">{{ series.name }}</h1>
        <p v-if="series.original_name" class="text-gray-600 text-lg mb-4">{{ series.original_name }}</p>
        <p v-if="series.tagline" class="text-gray-600 text-lg mb-4">{{ series.tagline }}</p>

        <div class="flex flex-wrap gap-4 mb-6">
          <span class="px-3 py-1 bg-yellow-400 rounded-full font-semibold">
            Рейтинг: {{ formatVoteAverage(series.vote_average) }}
          </span>
          <span class="px-3 py-1 bg-gray-200 rounded-full">
            {{ formatYearRange(series.first_air_date, series.last_air_date) }}
          </span>
          <span class="px-3 py-1 bg-gray-200 rounded-full">
            {{ series.number_of_seasons || 0 }} {{ pluralize('сезон', series.number_of_seasons) }}
          </span>
          <span class="px-3 py-1 bg-gray-200 rounded-full">
            {{ series.number_of_episodes || 0 }} {{ pluralize('эпизод', series.number_of_episodes) }}
          </span>
          <span v-if="series.in_production" class="px-3 py-1 bg-green-200 text-green-800 rounded-full">
            В производстве
          </span>
          <span v-if="series.adult" class="px-3 py-1 bg-red-200 text-red-800 rounded-full">
            18+
          </span>
        </div>

        <div v-if="series.genres && series.genres.length" class="mb-6">
          <h2 class="text-xl font-semibold mb-2">Жанры</h2>
          <div class="flex flex-wrap gap-2">
            <span
                v-for="genre in series.genres"
                :key="genre.id"
                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {{ genre.name }}
            </span>
          </div>
        </div>

        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-2">О сериале</h2>
          <p class="text-gray-700 leading-relaxed">{{ series.overview || 'Нет описания' }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div v-if="series.production_companies && series.production_companies.length">
            <h3 class="font-semibold mb-2">Производство</h3>
            <p class="text-gray-600">{{ formatCompanies(series.production_companies) }}</p>
          </div>

          <div v-if="series.networks && series.networks.length">
            <h3 class="font-semibold mb-2">Телеканалы</h3>
            <p class="text-gray-600">{{ formatNetworks(series.networks) }}</p>
          </div>

          <div v-if="series.production_countries && series.production_countries.length">
            <h3 class="font-semibold mb-2">Страны</h3>
            <p class="text-gray-600">{{ formatCountries(series.production_countries) }}</p>
          </div>

          <div v-if="series.spoken_languages && series.spoken_languages.length">
            <h3 class="font-semibold mb-2">Языки</h3>
            <p class="text-gray-600">{{ formatLanguages(series.spoken_languages) }}</p>
          </div>

          <div>
            <h3 class="font-semibold mb-2">Тип</h3>
            <p class="text-gray-600">{{ series.type || 'N/A' }}</p>
          </div>

          <div>
            <h3 class="font-semibold mb-2">Статус</h3>
            <p class="text-gray-600">{{ series.status || 'N/A' }}</p>
          </div>
        </div>

        <div v-if="series.homepage" class="mb-8">
          <a
              :href="series.homepage"
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

        <!-- Сезоны
        <div v-if="seasons.length" class="mt-8">
          <h2 class="text-2xl font-bold mb-4">Сезоны</h2>
          <div class="space-y-4">
            <div
                v-for="season in seasons"
                :key="season.id"
                class="border rounded-lg overflow-hidden"
            >
              <div
                  @click="toggleSeason(season.id)"
                  class="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition flex justify-between items-center"
              >
                <div>
                  <h3 class="font-semibold">{{ season.name || `Сезон ${season.season_number}` }}</h3>
                  <p class="text-sm text-gray-600">
                    {{ season.episode_count || 0 }} {{ pluralize('эпизод', season.episode_count) }} •
                    {{ formatYear(season.air_date) }}
                  </p>
                </div>
                <svg
                    class="w-5 h-5 transition-transform"
                    :class="{ 'rotate-180': expandedSeasons.includes(season.id) }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <div v-show="expandedSeasons.includes(season.id)" class="p-4 border-t">
                <div v-if="episodesLoading[season.id]" class="flex justify-center py-4">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
                <div v-else-if="episodes[season.id]?.length" class="space-y-2">
                  <div
                      v-for="episode in episodes[season.id]"
                      :key="episode.id"
                      class="p-3 bg-gray-50 rounded hover:bg-gray-100 transition"
                  >
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <h4 class="font-medium">
                          {{ episode.episode_number }}. {{ episode.name || 'Эпизод ' + episode.episode_number }}
                        </h4>
                        <p class="text-sm text-gray-600">{{ episode.overview || 'Нет описания' }}</p>
                      </div>
                      <div class="flex items-center space-x-2 text-sm ml-4">
                        <span class="text-yellow-600">★ {{ formatVoteAverage(episode.vote_average) }}</span>
                        <span class="text-gray-400">{{ formatRuntime(episode.runtime) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-4 text-gray-500">
                  Нет информации об эпизодах
                </div>
              </div>
            </div>
          </div>
        </div>-->

        <!-- Отладка (только в разработке) -->
        <div v-if="showDebug" class="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 class="font-semibold mb-2">Отладочная информация:</h3>
          <pre class="text-xs overflow-auto max-h-96">{{ JSON.stringify(series, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-12 text-gray-500">
    Сериал не найден
  </div>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue';
import { useRoute } from 'vue-router';
import { apiClient } from '@/api/client';
import {
  formatVoteAverage,
  formatYear,
  formatRuntime
} from '@/utils/formatters';

const route = useRoute();
const series = ref(null);
const seasons = ref([]);
const episodes = ref({});
const episodesLoading = ref({});
const expandedSeasons = ref([]);
const loading = ref(true);
const showDebug = import.meta.env.DEV;

// Состояние для постера
const posterLoadAttempted = ref(false);
const posterLoadFailed = ref(false);
const showPosterPlaceholder = computed(() => {
  return !series.value?.poster_path || posterLoadFailed.value;
});

// Текущий URL постера
const currentPosterUrl = computed(() => {
  if (!series.value?.poster_path) return null;

  // Если первая попытка загрузки не удалась, пробуем TMDB
  if (posterLoadAttempted.value && posterLoadFailed.value) {
    return `https://image.tmdb.org/t/p/w500${series.value.poster_path}`;
  }

  // Иначе пробуем локальный путь
  return `/images/posters${series.value.poster_path}`;
});

const handlePosterError = (e) => {
  console.log('❌ Ошибка загрузки постера:', e.target.src);

  if (!posterLoadAttempted.value) {
    // Первая ошибка - пробуем TMDB
    posterLoadAttempted.value = true;
    posterLoadFailed.value = true;
  } else {
    // Вторая ошибка - показываем заглушку
    posterLoadFailed.value = true;
  }
};

const handlePosterLoad = () => {
  console.log('✅ Постер успешно загружен:', currentPosterUrl.value);
  // Сбрасываем флаги при успешной загрузке
  posterLoadFailed.value = false;
};

const handleBackdropError = (e) => {
  e.target.style.display = 'none';
};

// Форматирование компаний
const formatCompanies = (companies) => {
  if (!companies || !companies.length) return 'N/A';
  return companies.map(c => c.name).join(', ');
};

// Форматирование телеканалов
const formatNetworks = (networks) => {
  if (!networks || !networks.length) return 'N/A';
  return networks.map(n => n.name).join(', ');
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

// Форматирование диапазона лет
const formatYearRange = (start, end) => {
  const startYear = formatYear(start);
  const endYear = end ? formatYear(end) : 'настоящее';
  return `${startYear} — ${endYear}`;
};

// Плюрализация
const pluralize = (word, count) => {
  if (!count || count === 0) return word + 'ов';
  if (count === 1) return word;
  if (count >= 2 && count <= 4) return word + 'а';
  return word + 'ов';
};

const toggleSeason = async (seasonId) => {
  const index = expandedSeasons.value.indexOf(seasonId);

  if (index === -1) {
    expandedSeasons.value.push(seasonId);

    if (!episodes.value[seasonId]) {
      episodesLoading.value[seasonId] = true;
      try {
        console.log('📺 Загружаем эпизоды для сезона:', seasonId);
        const response = await apiClient.getSeasonEpisodes(seasonId);
        console.log('📦 Эпизоды:', response);

        if (response.success) {
          episodes.value[seasonId] = response.data || [];
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки эпизодов:', error);
      } finally {
        episodesLoading.value[seasonId] = false;
      }
    }
  } else {
    expandedSeasons.value.splice(index, 1);
  }
};

onMounted(async () => {
  try {
    console.log('📺 Загружаем сериал с ID:', route.params.id);

    const response = await apiClient.getSeriesById(route.params.id);
    console.log('📦 Ответ от API:', response);

    if (response.success && response.data) {
      series.value = response.data;
      console.log('✅ Сериал загружен:', series.value);
      console.log('🖼️ Постер путь:', series.value.poster_path);

      // Загружаем сезоны
      const seasonsResponse = await apiClient.getSeriesSeasons(route.params.id);
      console.log('📦 Сезоны:', seasonsResponse);

      if (seasonsResponse.success) {
        seasons.value = seasonsResponse.data || [];
      }
    } else {
      console.error('❌ Ошибка в ответе API:', response);
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки сериала:', error);
  } finally {
    loading.value = false;
  }
});
</script>