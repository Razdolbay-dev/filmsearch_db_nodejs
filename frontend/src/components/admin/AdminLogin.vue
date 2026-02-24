<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Админ-панель</h1>
        <p class="text-gray-600 mt-2">Войдите для доступа к управлению</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">
            Имя пользователя
          </label>
          <input
              v-model="username"
              type="text"
              required
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="admin"
          />
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">
            Пароль
          </label>
          <input
              v-model="password"
              type="password"
              required
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="mb-4 text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
        >
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-500">
        Тестовый доступ: admin / admin123
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../../api/admin.client';

const router = useRouter();
const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await adminApi.login(username.value, password.value);

    if (response.success) {
      router.push('/admin/dashboard');
    }
  } catch (err) {
    error.value = err.message || 'Ошибка при входе';
  } finally {
    loading.value = false;
  }
};
</script>