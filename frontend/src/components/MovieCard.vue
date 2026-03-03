<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
    <div class="relative pb-[150%] bg-gray-200">
      <img
          v-if="movie.poster_path"
          :src="`images/posters${movie.poster_path}`"
          :alt="movie.title"
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
    </div>

    <div class="p-4">
      <h3 class="font-semibold text-lg mb-1 truncate" :title="movie.title">{{ movie.title }}</h3>
      <p class="text-gray-600 text-sm mb-2">{{ formattedYear }}</p>
      <p class="text-gray-700 text-sm line-clamp-3">{{ movie.overview || 'Нет описания' }}</p>

      <button
          @click="$emit('view-details', movie.id)"
          class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Подробнее
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  movie: {
    type: Object,
    required: true
  }
});

defineEmits(['view-details']);

// Форматируем рейтинг с проверкой типа
const formattedVoteAverage = computed(() => {
  if (!props.movie.vote_average && props.movie.vote_average !== 0) return props.movie.vote_average;

  // Преобразуем в число, если это строка
  const voteAverage = parseFloat(props.movie.vote_average);

  // Проверяем, что получилось валидное число
  if (isNaN(voteAverage)) return 'N/A';

  return voteAverage.toFixed(1);
});

// Форматируем год с проверкой
const formattedYear = computed(() => {
  if (!props.movie.release_date) return 'N/A';

  // Если release_date приходит как "2023-12-25" или подобное
  if (typeof props.movie.release_date === 'string' && props.movie.release_date.includes('-')) {
    return props.movie.release_date.split('-')[0];
  }

  return props.movie.release_date || 'N/A';
});

// Обработка ошибок загрузки изображений
const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/500x750?text=No+Image';
};
</script>