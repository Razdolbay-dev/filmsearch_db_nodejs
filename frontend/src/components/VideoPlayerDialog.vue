<!-- VideoPlayerDialog.vue -->
<template>
  <div v-if="visible" class="fixed inset-0 z-60 overflow-y-auto" @click.self="close">
    <div class="fixed inset-0 bg-black bg-opacity-50"></div>

    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Выберите приложение для воспроизведения
          </h3>

          <div class="space-y-2 max-h-96 overflow-y-auto">
            <button
                v-for="app in availableApps"
                :key="app.name"
                @click="selectApp(app)"
                class="w-full bg-gray-50 hover:bg-blue-50 rounded-lg p-3 text-left transition-colors flex items-center gap-3"
            >
              <img
                  v-if="app.icon"
                  :src="app.icon"
                  class="w-8 h-8"
                  alt=""
              />
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ app.displayName }}</div>
                <div class="text-sm text-gray-500">{{ app.command }}</div>
              </div>
              <span class="text-blue-600">▶</span>
            </button>
          </div>

          <div class="mt-4 pt-4 border-t">
            <button
                @click="openInBrowser"
                class="w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-3 text-center transition-colors"
            >
              Открыть в браузере
            </button>
          </div>

          <button
              @click="close"
              class="mt-3 w-full text-gray-500 hover:text-gray-700 text-sm"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  visible: Boolean,
  url: String,
  fileName: String
});

const emit = defineEmits(['close', 'select']);

// Определяем доступные плееры для разных ОС
const getAvailableApps = () => {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();

  // Windows
  if (platform.includes('win')) {
    return [
      { name: 'mpv', displayName: 'MPV Player', command: 'mpv', icon: null },
      { name: 'vlc', displayName: 'VLC Media Player', command: 'vlc', icon: null },
      { name: 'potplayer', displayName: 'PotPlayer', command: 'potplayer', icon: null },
      { name: 'mpc-hc', displayName: 'Media Player Classic', command: 'mpc-hc', icon: null }
    ];
  }

  // macOS
  if (platform.includes('mac')) {
    return [
      { name: 'mpv', displayName: 'MPV Player', command: 'mpv', icon: null },
      { name: 'vlc', displayName: 'VLC Media Player', command: 'vlc', icon: null },
      { name: 'iina', displayName: 'IINA', command: 'iina', icon: null },
      { name: 'quicktime', displayName: 'QuickTime Player', command: 'open -a QuickTime\\ Player', icon: null }
    ];
  }

  // Linux
  if (platform.includes('linux')) {
    return [
      { name: 'mpv', displayName: 'MPV Player', command: 'mpv', icon: null },
      { name: 'vlc', displayName: 'VLC Media Player', command: 'vlc', icon: null },
      { name: 'celluloid', displayName: 'Celluloid', command: 'celluloid', icon: null },
      { name: 'smplayer', displayName: 'SMPlayer', command: 'smplayer', icon: null }
    ];
  }

  return [];
};

const availableApps = ref(getAvailableApps());

const selectApp = (app) => {
  emit('select', {
    app: app.name,
    command: app.command,
    url: props.url
  });
  close();
};

const openInBrowser = () => {
  window.open(props.url, '_blank');
  close();
};

const close = () => {
  emit('close');
};
</script>