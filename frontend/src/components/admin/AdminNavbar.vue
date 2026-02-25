<template>
  <nav class="bg-gray-900 text-white shadow-lg rounded-lg">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <!-- Левая часть с логотипом и десктопным меню -->
        <div class="flex items-center space-x-8">
          <router-link to="/admin/dashboard" class="text-xl font-bold hover:text-blue-400 transition">
            Admin Panel
          </router-link>

          <!-- Десктопное меню (скрываем на мобильных) -->
          <div class="hidden md:flex space-x-4">
            <router-link
                to="/admin/dashboard"
                class="hover:text-blue-400 transition px-2 py-1"
                :class="{ 'text-blue-400': $route.path === '/admin/dashboard' }"
            >
              Дашборд
            </router-link>
            <router-link
                to="/admin/movies"
                class="hover:text-blue-400 transition px-2 py-1"
                :class="{ 'text-blue-400': $route.path.startsWith('/admin/movies') }"
            >
              Фильмы
            </router-link>
            <router-link
                to="/admin/series"
                class="hover:text-blue-400 transition px-2 py-1"
                :class="{ 'text-blue-400': $route.path.startsWith('/admin/series') }"
            >
              Сериалы
            </router-link>
            <router-link
                to="/admin/sync"
                class="hover:text-blue-400 transition px-2 py-1"
                :class="{ 'text-blue-400': $route.path === '/admin/sync' }"
            >
              Синхронизация
            </router-link>
            <router-link
                v-if="currentAdmin?.role === 'superadmin'"
                to="/admin/admins"
                class="hover:text-blue-400 transition px-2 py-1"
                :class="{ 'text-blue-400': $route.path === '/admin/admins' }"
            >
              Администраторы
            </router-link>
          </div>
        </div>

        <!-- Правая часть с пользователем и кнопкой выхода -->
        <div class="flex items-center space-x-4">
          <!-- Информация о пользователе (скрываем на мобильных) -->
          <span class="hidden md:inline text-sm">
            {{ currentAdmin?.username }}
            <span class="text-xs bg-gray-700 px-2 py-1 rounded ml-2">
              {{ currentAdmin?.role }}
            </span>
          </span>

          <!-- Кнопка выхода (всегда видна) -->
          <button
              @click="handleLogout"
              class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition flex items-center"
          >
            <span class="hidden sm:inline">Выйти</span>
            <span class="sm:hidden">🚪</span>
          </button>

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
      </div>

      <!-- Мобильное меню -->
      <div
          v-show="isMenuOpen"
          class="md:hidden py-4 border-t border-gray-800"
      >
        <!-- Информация о пользователе для мобильных -->
        <div class="px-4 py-3 bg-gray-800 rounded-lg mb-3">
          <div class="font-medium">{{ currentAdmin?.username }}</div>
          <div class="text-sm text-gray-400">Роль: {{ currentAdmin?.role }}</div>
        </div>

        <!-- Навигационные ссылки для мобильных -->
        <div class="flex flex-col space-y-2">
          <router-link
              to="/admin/dashboard"
              @click="closeMenu"
              class="px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center"
              :class="{ 'bg-gray-800 text-blue-400': $route.path === '/admin/dashboard' }"
          >
            <span class="mr-3">📊</span> Дашборд
          </router-link>

          <router-link
              to="/admin/movies"
              @click="closeMenu"
              class="px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center"
              :class="{ 'bg-gray-800 text-blue-400': $route.path.startsWith('/admin/movies') }"
          >
            <span class="mr-3">🎬</span> Фильмы
          </router-link>

          <router-link
              to="/admin/series"
              @click="closeMenu"
              class="px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center"
              :class="{ 'bg-gray-800 text-blue-400': $route.path.startsWith('/admin/series') }"
          >
            <span class="mr-3">📺</span> Сериалы
          </router-link>

          <router-link
              to="/admin/sync"
              @click="closeMenu"
              class="px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center"
              :class="{ 'bg-gray-800 text-blue-400': $route.path === '/admin/sync' }"
          >
            <span class="mr-3">🔄</span> Синхронизация
          </router-link>

          <router-link
              v-if="currentAdmin?.role === 'superadmin'"
              to="/admin/admins"
              @click="closeMenu"
              class="px-4 py-3 rounded-lg hover:bg-gray-800 transition flex items-center"
              :class="{ 'bg-gray-800 text-blue-400': $route.path === '/admin/admins' }"
          >
            <span class="mr-3">👥</span> Администраторы
          </router-link>

          <!-- Кнопка выхода для мобильных (дубль) -->
          <button
              @click="handleMobileLogout"
              class="px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition flex items-center mt-2"
          >
            <span class="mr-3">🚪</span> Выйти
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { adminApi } from '@/api/admin.client';

const props = defineProps({
  currentAdmin: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['logout']);

const router = useRouter();
const route = useRoute();
const isMenuOpen = ref(false);

// Закрываем меню при смене маршрута
watch(() => route.path, () => {
  closeMenu();
});

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleLogout = async () => {
  emit('logout');
};

const handleMobileLogout = async () => {
  closeMenu();
  emit('logout');
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

/* Улучшаем тач-области на мобильных */
@media (max-width: 768px) {
  .px-4.py-3 {
    min-height: 48px;
  }
}
</style>