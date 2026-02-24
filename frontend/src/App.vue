<template>
  <div class="min-h-screen bg-gray-100">
    <Navbar />

    <main class="container mx-auto px-4 py-8">
      <router-view />
    </main>

    <ConnectionStatus />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Navbar from './components/Navbar.vue';
import ConnectionStatus from './components/ConnectionStatus.vue';
import { apiClient } from './api/client';

const showDebugInfo = import.meta.env.DEV;
const windowLocation = computed(() => window.location.host);
const currentApiUrl = computed(() => apiClient.getCurrentApiUrl());

const copyApiUrl = () => {
  navigator.clipboard.writeText(currentApiUrl.value);
  // Можно добавить уведомление
  alert('URL API скопирован: ' + currentApiUrl.value);
};
</script>