<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Дашборд</h1>
      <div class="text-sm text-gray-600">
        Последний вход: {{ formatDate(currentAdmin?.last_login) }}
      </div>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Всего фильмов</p>
            <p class="text-3xl font-bold">{{ stats.movies || '0' }}</p>
          </div>
          <div class="bg-blue-100 p-3 rounded-lg">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-500">
          <span class="text-green-600">+{{ stats.newMovies || 0 }}</span> за последние 7 дней
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Всего сериалов</p>
            <p class="text-3xl font-bold">{{ stats.series || '0' }}</p>
          </div>
          <div class="bg-green-100 p-3 rounded-lg">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-500">
          <span class="text-green-600">{{ stats.inProduction || 0 }}</span> в производстве
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Всего жанров</p>
            <p class="text-3xl font-bold">{{ stats.genres || '0' }}</p>
          </div>
          <div class="bg-purple-100 p-3 rounded-lg">
            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-5-5A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Администраторов</p>
            <p class="text-3xl font-bold">{{ stats.admins || '1' }}</p>
          </div>
          <div class="bg-yellow-100 p-3 rounded-lg">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Графики и активность -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Популярные фильмы -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">Популярные фильмы</h2>
        <div class="space-y-3">
          <div v-for="(movie, index) in popularMovies" :key="movie.id"
               class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div class="flex items-center space-x-3">
              <span class="text-gray-500 w-6">{{ index + 1 }}</span>
              <img v-if="movie.poster_path"
                   :src="`https://image.tmdb.org/t/p/w92${movie.poster_path}`"
                   class="w-10 h-14 object-cover rounded">
              <div v-else class="w-10 h-14 bg-gray-200 rounded flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p class="font-medium">{{ movie.title }}</p>
                <p class="text-sm text-gray-500">{{ movie.release_date?.split('-')[0] }}</p>
              </div>
            </div>
            <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
              ★ {{ Number(movie.popularity).toFixed(1) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Популярные сериалы -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">Популярные сериалы</h2>
        <div class="space-y-3">
          <div v-for="(series, index) in popularSeries" :key="series.id"
               class="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div class="flex items-center space-x-3">
              <span class="text-gray-500 w-6">{{ index + 1 }}</span>
              <img v-if="series.poster_path"
                   :src="`https://image.tmdb.org/t/p/w92${series.poster_path}`"
                   class="w-10 h-14 object-cover rounded">
              <div v-else class="w-10 h-14 bg-gray-200 rounded flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p class="font-medium">{{ series.name }}</p>
                <p class="text-sm text-gray-500">{{ series.first_air_date?.split('-')[0] }}</p>
              </div>
            </div>
            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
              S{{ series.number_of_seasons }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold mb-4">Быстрые действия</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
            @click="goToMovies"
            class="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-left group"
        >
          <div class="flex items-center space-x-3">
            <div class="bg-blue-500 p-2 rounded-lg group-hover:scale-110 transition">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Управление фильмами</h3>
              <p class="text-sm text-gray-600 mt-1">Добавить, редактировать, удалить</p>
            </div>
          </div>
        </button>

        <button
            @click="goToSeries"
            class="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-left group"
        >
          <div class="flex items-center space-x-3">
            <div class="bg-green-500 p-2 rounded-lg group-hover:scale-110 transition">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Управление сериалами</h3>
              <p class="text-sm text-gray-600 mt-1">Добавить, редактировать, удалить</p>
            </div>
          </div>
        </button>

        <button
            @click="goToAdmins"
            v-if="currentAdmin?.role === 'superadmin'"
            class="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-left group"
        >
          <div class="flex items-center space-x-3">
            <div class="bg-purple-500 p-2 rounded-lg group-hover:scale-110 transition">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Администраторы</h3>
              <p class="text-sm text-gray-600 mt-1">Управление доступами</p>
            </div>
          </div>
        </button>

        <button
            @click="showChangePassword = true"
            class="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition text-left group"
        >
          <div class="flex items-center space-x-3">
            <div class="bg-yellow-500 p-2 rounded-lg group-hover:scale-110 transition">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Сменить пароль</h3>
              <p class="text-sm text-gray-600 mt-1">Изменить пароль</p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Модалка смены пароля -->
    <div v-if="showChangePassword" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">Смена пароля</h2>

        <form @submit.prevent="changePassword">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Текущий пароль
            </label>
            <input
                v-model="passwordForm.oldPassword"
                type="password"
                required
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Новый пароль
            </label>
            <input
                v-model="passwordForm.newPassword"
                type="password"
                required
                minlength="6"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p class="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">
              Подтверждение пароля
            </label>
            <input
                v-model="passwordForm.confirmPassword"
                type="password"
                required
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                :class="{ 'border-red-500': passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword }"
            />
          </div>

          <div v-if="passwordError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {{ passwordError }}
          </div>

          <div class="flex justify-end space-x-2">
            <button
                type="button"
                @click="closePasswordModal"
                class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Отмена
            </button>
            <button
                type="submit"
                :disabled="passwordLoading || !isPasswordValid"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {{ passwordLoading ? 'Смена...' : 'Сменить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../../api/admin.client';
import { apiClient } from '../../api/client';

const router = useRouter();
const currentAdmin = ref(null);
const stats = ref({});
const popularMovies = ref([]);
const popularSeries = ref([]);
const showChangePassword = ref(false);
const passwordLoading = ref(false);
const passwordError = ref('');
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const isPasswordValid = computed(() => {
  return passwordForm.value.newPassword.length >= 6 &&
      passwordForm.value.newPassword === passwordForm.value.confirmPassword;
});

const formatDate = (date) => {
  if (!date) return 'никогда';
  return new Date(date).toLocaleString('ru-RU');
};

const loadDashboardData = async () => {
  try {
    // Загружаем текущего админа
    const adminResponse = await adminApi.getCurrentAdmin();
    currentAdmin.value = adminResponse.data;

    // Загружаем популярные фильмы
    const moviesResponse = await apiClient.getPopularMovies(5);
    popularMovies.value = moviesResponse.data || [];

    // Загружаем популярные сериалы
    const seriesResponse = await apiClient.getPopularSeries(5);
    popularSeries.value = seriesResponse.data || [];

    // Здесь можно загрузить статистику с бэкенда
    // stats.value = await adminApi.getStats();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
};

const goToMovies = () => router.push('/admin/movies');
const goToSeries = () => router.push('/admin/series');
const goToAdmins = () => router.push('/admin/admins');

const closePasswordModal = () => {
  showChangePassword.value = false;
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  passwordError.value = '';
};

const changePassword = async () => {
  if (!isPasswordValid.value) return;

  passwordLoading.value = true;
  passwordError.value = '';

  try {
    await adminApi.changePassword(
        passwordForm.value.oldPassword,
        passwordForm.value.newPassword
    );
    closePasswordModal();
    alert('Пароль успешно изменен');
  } catch (error) {
    passwordError.value = error.message;
  } finally {
    passwordLoading.value = false;
  }
};

onMounted(() => {
  loadDashboardData();
});
</script>
