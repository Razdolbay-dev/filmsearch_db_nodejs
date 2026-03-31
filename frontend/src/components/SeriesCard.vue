<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
    <div class="relative pb-[150%] bg-gray-200">
      <img
          v-if="series.poster_path"
          :src="`images/posters${series.poster_path}`"
          :alt="series.name"
          class="absolute inset-0 w-full h-full object-cover"
          @error="handleImageError"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400">
        <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 4h16v16H4V4z" />
        </svg>
      </div>

      <div class="absolute top-2 right-2 bg-yellow-400 text-gray-900 font-bold px-2 py-1 rounded text-sm">
        {{ formattedVoteAverage }}
      </div>

      <div v-if="series.in_production" class="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
        В производстве
      </div>
    </div>

    <div class="p-4">
      <h3 class="font-semibold text-lg mb-1 truncate" :title="series.name">{{ series.name }}</h3>
      <p class="text-gray-600 text-sm mb-1">{{ formattedYearRange }}</p>
      <p class="text-gray-600 text-sm mb-2">Сезонов: {{ series.number_of_seasons || 'N/A' }}</p>
      <p class="text-gray-700 text-sm line-clamp-2">{{ series.overview || 'Нет описания' }}</p>

      <!-- Кнопки действий -->
      <div class="flex gap-2 mt-2">
        <button
            @click="$emit('view-details', series.id)"
            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Подробнее
        </button>

        <!-- Новая кнопка поиска торрентов -->
        <button
            @click="$emit('search-torrent', {
              title: series.name,
              year: firstAirYear,
              type: 'series'
            })"
            class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            title="Найти торрент"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  series: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['view-details', 'search-torrent']);

const formattedVoteAverage = computed(() => {
  if (!props.series.vote_average && props.series.vote_average !== 0) return 'N/A';
  const voteAverage = parseFloat(props.series.vote_average);
  if (isNaN(voteAverage)) return 'N/A';
  return voteAverage.toFixed(1);
});

const firstAirYear = computed(() => {
  if (!props.series.first_air_date) return null;
  if (typeof props.series.first_air_date === 'string' && props.series.first_air_date.includes('-')) {
    return props.series.first_air_date.split('-')[0];
  }
  return props.series.first_air_date;
});

const formattedYearRange = computed(() => {
  const firstYear = firstAirYear.value || 'N/A';
  const lastYear = props.series.last_air_date?.split('-')[0] || '...';
  return `${firstYear} - ${lastYear}`;
});

const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/500x750?text=No+Image';
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>