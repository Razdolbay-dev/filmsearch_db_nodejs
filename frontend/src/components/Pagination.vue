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
      <button
          v-for="page in displayedPages"
          :key="page"
          @click="$emit('page-change', page)"
          :class="[
          'w-10 h-10 rounded transition',
          currentPage === page
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300'
        ]"
      >
        {{ page }}
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

const displayedPages = computed(() => {
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= props.totalPages; i++) {
    if (i === 1 || i === props.totalPages || (i >= props.currentPage - delta && i <= props.currentPage + delta)) {
      range.push(i);
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  });

  return rangeWithDots;
});
</script>