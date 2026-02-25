<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Навигация админки (вынесена в отдельный компонент) -->
    <AdminNavbar
        :current-admin="currentAdmin"
        @logout="handleLogout"
    />

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
import AdminNavbar from '@/components/admin/AdminNavbar.vue';

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