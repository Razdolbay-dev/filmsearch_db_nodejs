<template>
  <div class="flex justify-center items-center space-x-2 mt-8">
    <button
        @click="$emit('page-change', currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      Назад
    </button>

    <div class="flex space-x-1">
      <!-- Первая страница -->
      <button
          v-if="shouldShowFirstPage"
          @click="$emit('page-change', 1)"
          :class="[
            'w-10 h-10 rounded transition',
            currentPage === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          ]"
      >
        1
      </button>

      <!-- Левое многоточие -->
      <span v-if="showLeftDots" class="w-10 h-10 flex items-center justify-center">...</span>

      <!-- Страницы вокруг текущей -->
      <button
          v-for="page in middlePages"
          :key="page"
          @click="$emit('page-change', page)"
          :class="[
            'w-10 h-10 rounded transition',
            currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          ]"
      >
        {{ page }}
      </button>

      <!-- Правое многоточие -->
      <span v-if="showRightDots" class="w-10 h-10 flex items-center justify-center">...</span>

      <!-- Последняя страница -->
      <button
          v-if="shouldShowLastPage"
          @click="$emit('page-change', totalPages)"
          :class="[
            'w-10 h-10 rounded transition',
            currentPage === totalPages ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          ]"
      >
        {{ totalPages }}
      </button>
    </div>

    <button
        @click="$emit('page-change', currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      Вперед
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
});

defineEmits(['page-change']);

// Показывать первую страницу только если текущая страница не рядом с началом
const shouldShowFirstPage = computed(() => {
  return props.currentPage > 3;
});

// Показывать последнюю страницу только если текущая страница не рядом с концом
const shouldShowLastPage = computed(() => {
  return props.currentPage < props.totalPages - 2;
});

// Показывать левое многоточие
const showLeftDots = computed(() => {
  return props.currentPage > 4;
});

// Показывать правое многоточие
const showRightDots = computed(() => {
  return props.currentPage < props.totalPages - 3;
});

// Страницы вокруг текущей (всегда 3 страницы: предыдущая, текущая, следующая)
const middlePages = computed(() => {
  const pages = [];

  // Предыдущая страница (если существует)
  if (props.currentPage > 1) {
    pages.push(props.currentPage - 1);
  }

  // Текущая страница
  pages.push(props.currentPage);

  // Следующая страница (если существует)
  if (props.currentPage < props.totalPages) {
    pages.push(props.currentPage + 1);
  }

  return pages;
});
</script>