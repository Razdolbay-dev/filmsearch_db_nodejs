<template>
  <div>
    <h1 class="text-3xl font-bold mb-8">Дашборд</h1>

    <!-- Статистика -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-gray-500 text-sm mb-2">Всего фильмов</h3>
        <p class="text-3xl font-bold">{{ stats.movies || '...' }}</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-gray-500 text-sm mb-2">Всего сериалов</h3>
        <p class="text-3xl font-bold">{{ stats.series || '...' }}</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-gray-500 text-sm mb-2">Администраторов</h3>
        <p class="text-3xl font-bold">{{ stats.admins || '...' }}</p>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold mb-4">Быстрые действия</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
            @click="goToMovies"
            class="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-left"
        >
          <h3 class="font-semibold">Управление фильмами</h3>
          <p class="text-sm text-gray-600 mt-1">Добавить, редактировать, удалить</p>
        </button>

        <button
            @click="goToSeries"
            class="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-left"
        >
          <h3 class="font-semibold">Управление сериалами</h3>
          <p class="text-sm text-gray-600 mt-1">Добавить, редактировать, удалить</p>
        </button>

        <button
            @click="goToAdmins"
            v-if="isSuperAdmin"
            class="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-left"
        >
          <h3 class="font-semibold">Администраторы</h3>
          <p class="text-sm text-gray-600 mt-1">Управление доступами</p>
        </button>

        <button
            @click="showChangePassword = true"
            class="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition text-left"
        >
          <h3 class="font-semibold">Сменить пароль</h3>
          <p class="text-sm text-gray-600 mt-1">Изменить пароль</p>
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
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div v-if="passwordError" class="mb-4 text-red-500 text-sm">
            {{ passwordError }}
          </div>

          <div class="flex justify-end space-x-2">
            <button
                type="button"
                @click="showChangePassword = false"
                class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Отмена
            </button>
            <button
                type="submit"
                :disabled="passwordLoading"
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

const router = useRouter();
const stats = ref({});
const showChangePassword = ref(false);
const passwordLoading = ref(false);
const passwordError = ref('');
const passwordForm = ref({
  oldPassword: '',
  newPassword: ''
});

const isSuperAdmin = computed(() => {
  // Здесь должна быть проверка роли из текущего пользователя
  return true; // Временно
});

const loadStats = async () => {
  // Загрузка статистики
};

const goToMovies = () => router.push('/admin/movies');
const goToSeries = () => router.push('/admin/series');
const goToAdmins = () => router.push('/admin/admins');

const changePassword = async () => {
  passwordLoading.value = true;
  passwordError.value = '';

  try {
    await adminApi.changePassword(
        passwordForm.value.oldPassword,
        passwordForm.value.newPassword
    );
    showChangePassword.value = false;
    passwordForm.value = { oldPassword: '', newPassword: '' };
    alert('Пароль успешно изменен');
  } catch (error) {
    passwordError.value = error.message;
  } finally {
    passwordLoading.value = false;
  }
};

onMounted(() => {
  loadStats();
});
</script>