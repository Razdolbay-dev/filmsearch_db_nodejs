<template>
  <nav class="bg-gray-900 text-white shadow-lg">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <!-- Логотип -->
        <router-link to="/" class="text-xl font-bold hover:text-green-400 transition">
          KinoSHka
        </router-link>

        <!-- Десктопное меню (скрываем на мобильных) -->
        <div class="hidden md:flex items-center space-x-6">
          <router-link
              to="/movies"
              class="hover:text-red-400 transition"
              :class="{ 'text-red-400': $route.path.startsWith('/movies') }"
          >
            Фильмы
          </router-link>
          <router-link
              to="/series"
              class="hover:text-blue-400 transition"
              :class="{ 'text-blue-400': $route.path.startsWith('/series') }"
          >
            Сериалы
          </router-link>
          <router-link
              to="/cartoons"
              class="hover:text-purple-400 transition"
              :class="{ 'text-purple-400': $route.path.startsWith('/cartoons') }"
          >
          Мультфильмы
          </router-link>

        </div>

        <!-- Поиск на десктопе (скрываем на мобильных) -->
        <!--<div class="hidden md:block relative">
          <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              placeholder="Поиск..."
              class="bg-gray-800 text-white px-4 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
          />
        </div>-->

        <!-- Кнопка бургер-меню (только на мобильных) -->
        <button
            @click="toggleMenu"
            class="md:hidden p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Меню"
        >
          <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
          >
            <path
                v-if="!isMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
            />
            <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Мобильное меню -->
      <div
          v-show="isMenuOpen"
          class="md:hidden py-4 border-t border-gray-800"
      >
        <!-- Поиск на мобильных -->
        <!--<div class="relative mb-4">
          <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="handleMobileSearch"
              placeholder="Поиск фильмов и сериалов..."
              class="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>-->

        <!-- Навигационные ссылки для мобильных -->
        <div class="flex flex-col space-y-2">
          <router-link
              to="/movies"
              @click="closeMenu"
              class="px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center"
              :class="{ 'bg-gray-800 text-blue-400': $route.path.startsWith('/movies') }"
          >
            <span class="mr-2">🎬</span> Фильмы
          </router-link>
          <router-link
              to="/series"
              @click="closeMenu"
              class="px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center"
              :class="{ 'bg-gray-800 text-blue-400': $route.path.startsWith('/series') }"
          >
            <span class="mr-2">📺</span> Сериалы
          </router-link>
          <router-link
              to="/cartoons"
              @click="closeMenu"
              class="px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center"
              :class="{ 'bg-gray-800 text-purple-400': $route.path.startsWith('/cartoons') }"
          >
            <span class="mr-2">🎨</span> Мультфильмы
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const isMenuOpen = ref(false);

// Закрываем меню при смене маршрута
watch(() => router.currentRoute.value.path, () => {
  closeMenu();
});

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    const currentPath = router.currentRoute.value.path;
    if (currentPath.startsWith('/series')) {
      router.push(`/series/search?q=${searchQuery.value}`);
    } else {
      router.push(`/movies/search?q=${searchQuery.value}`);
    }
  }
};

// Отдельный обработчик для мобильного поиска (закрывает меню после поиска)
const handleMobileSearch = () => {
  handleSearch();
  closeMenu();
};
</script>

<style scoped>
/* Анимация для плавного открытия/закрытия меню */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

/* Увеличиваем ширину поиска на десктопе */
@media (min-width: 768px) {
  .md\:w-64 {
    width: 16rem;
  }
}

/* Стили для активных ссылок на мобильных */
@media (max-width: 768px) {
  .router-link-active {
    background-color: rgba(59, 130, 246, 0.1);
  }
}
</style>