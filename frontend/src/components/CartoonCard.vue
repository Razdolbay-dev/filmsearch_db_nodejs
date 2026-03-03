<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
    <div class="relative pb-[150%] bg-gray-200">
      <!-- Постер -->
      <img
          v-if="cartoon.poster_path"
          :src="`images/posters${cartoon.poster_path}`"
          :alt="cartoon.title"
          class="absolute inset-0 w-full h-full object-cover"
          @error="handleImageError"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400">
        <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 4h16v16H4V4z" />
        </svg>
      </div>

      <!-- Рейтинг -->
      <div class="absolute top-2 right-2 bg-yellow-400 text-gray-900 font-bold px-2 py-1 rounded text-sm">
        {{ formattedVoteAverage }}
      </div>

      <!-- Бейдж типа (фильм/сериал) -->
      <div class="absolute top-2 left-2 rounded-lg" :class="typeBadgeClass">
        <span class="text-white text-xs font-bold px-2 py-1 rounded">
          {{ cartoon.type === 'movie' ? '🎬 Фильм' : '📺 Сериал' }}
        </span>
      </div>

      <!-- Бейдж "В производстве" для сериалов -->
      <div v-if="cartoon.type === 'series' && cartoon.in_production" class="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
        В производстве
      </div>
    </div>

    <div class="p-4">
      <!-- Название -->
      <h3 class="font-semibold text-lg mb-1 truncate" :title="cartoon.title">{{ cartoon.title }}</h3>

      <!-- Год и тип -->
      <div class="flex justify-between items-center mb-2">
        <p class="text-gray-600 text-sm">{{ cartoon.year || 'N/A' }}</p>
        <p v-if="cartoon.type === 'series'" class="text-gray-600 text-xs rounded-lg">
          {{ cartoon.seasons }} {{ pluralize('сезон', cartoon.seasons) }}
        </p>
      </div>

      <!-- Описание -->
      <p class="text-gray-700 text-sm line-clamp-3">{{ cartoon.overview || 'Нет описания' }}</p>

      <!-- Кнопка -->
      <button
          @click="$emit('view-details', cartoon.id, cartoon.type)"
          class="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Подробнее
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  cartoon: {
    type: Object,
    required: true
  }
});

defineEmits(['view-details']);

// Форматирование рейтинга
const formattedVoteAverage = computed(() => {
  if (!props.cartoon.vote_average && props.cartoon.vote_average !== 0) return 'N/A';
  const voteAverage = parseFloat(props.cartoon.vote_average);
  if (isNaN(voteAverage)) return 'N/A';
  return voteAverage.toFixed(1);
});

// Класс для бейджа типа
const typeBadgeClass = computed(() => {
  return props.cartoon.type === 'movie'
      ? 'bg-blue-600'
      : 'bg-orange-600';
});

// Плюрализация
const pluralize = (word, count) => {
  if (!count || count === 0) return word + 'ов';
  if (count === 1) return word;
  if (count >= 2 && count <= 4) return word + 'а';
  return word + 'ов';
};

// Обработка ошибок изображений
const handleImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/500x750?text=No+Image';
};
</script>