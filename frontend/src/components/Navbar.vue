<template>
  <nav class="bg-gray-900 text-white shadow-lg">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <router-link to="/" class="text-xl font-bold hover:text-blue-400 transition">
          TMDB Explorer
        </router-link>

        <div class="flex space-x-6">
          <router-link
              to="/movies"
              class="hover:text-blue-400 transition"
              :class="{ 'text-blue-400': $route.path.startsWith('/movies') }"
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
        </div>

        <div class="relative">
          <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              placeholder="Поиск..."
              class="bg-gray-800 text-white px-4 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    // Определяем текущий раздел и перенаправляем на поиск
    const currentPath = router.currentRoute.value.path;
    if (currentPath.startsWith('/series')) {
      router.push(`/series/search?q=${searchQuery.value}`);
    } else {
      router.push(`/movies/search?q=${searchQuery.value}`);
    }
  }
};
</script>