<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Навигация админки -->
    <nav class="bg-gray-900 text-white shadow-lg">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-8">
            <router-link to="/admin/dashboard" class="text-xl font-bold hover:text-blue-400 transition">
              Admin Panel
            </router-link>

            <div class="flex space-x-4">
              <router-link
                  to="/admin/dashboard"
                  class="hover:text-blue-400 transition"
                  :class="{ 'text-blue-400': $route.path === '/admin/dashboard' }"
              >
                Дашборд
              </router-link>
              <router-link
                  to="/admin/movies"
                  class="hover:text-blue-400 transition"
                  :class="{ 'text-blue-400': $route.path.startsWith('/admin/movies') }"
              >
                Фильмы
              </router-link>
              <router-link
                  to="/admin/series"
                  class="hover:text-blue-400 transition"
                  :class="{ 'text-blue-400': $route.path.startsWith('/admin/series') }"
              >
                Сериалы
              </router-link>
              <router-link
                  to="/admin/sync"
              class="hover:text-blue-400 transition"
              :class="{ 'text-blue-400': $route.path === '/admin/sync' }"
              >
              Синхронизация
              </router-link>
              <router-link
                  to="/admin/admins"
                  v-if="currentAdmin?.role === 'superadmin'"
                  class="hover:text-blue-400 transition"
                  :class="{ 'text-blue-400': $route.path === '/admin/admins' }"
              >
                Администраторы
              </router-link>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <span class="text-sm">
              {{ currentAdmin?.username }}
              <span class="text-xs bg-gray-700 px-2 py-1 rounded ml-2">
                {{ currentAdmin?.role }}
              </span>
            </span>
            <button
                @click="handleLogout"
                class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Основной контент -->
    <main class="container mx-auto px-4 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '@/api/admin.client';

const router = useRouter();
const currentAdmin = ref(null);

const loadCurrentAdmin = async () => {
  try {
    const response = await adminApi.getCurrentAdmin();
    currentAdmin.value = response.data;
  } catch (error) {
    console.error('Failed to load admin:', error);
    router.push('/admin/login');
  }
};

const handleLogout = async () => {
  try {
    await adminApi.logout();
    router.push('/admin/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

onMounted(() => {
  loadCurrentAdmin();
});
</script>