<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Тест авторизации</h1>

    <div class="space-y-4">
      <div>
        <button @click="checkAuth" class="bg-blue-500 text-white px-4 py-2 rounded">
          Проверить авторизацию
        </button>
      </div>

      <div v-if="authResult" class="bg-gray-100 p-4 rounded">
        <pre class="whitespace-pre-wrap">{{ JSON.stringify(authResult, null, 2) }}</pre>
      </div>

      <div>
        <button @click="checkCookie" class="bg-green-500 text-white px-4 py-2 rounded">
          Показать cookies
        </button>
        <div v-if="cookies" class="mt-2">{{ cookies }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { adminApi } from '@/api/admin.client';

const authResult = ref(null);
const cookies = ref('');

const checkAuth = async () => {
  try {
    const response = await adminApi.getCurrentAdmin();
    authResult.value = response;
  } catch (error) {
    authResult.value = { error: error.message };
  }
};

const checkCookie = () => {
  cookies.value = document.cookie || 'Нет cookies';
};
</script>