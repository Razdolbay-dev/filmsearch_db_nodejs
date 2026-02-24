<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Управление администраторами</h1>
      <button
          @click="showAddModal = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Добавить администратора
      </button>
    </div>

    <!-- Таблица администраторов -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="admins.length" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя пользователя</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Последний вход</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
          <tr v-for="admin in admins" :key="admin.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-500">{{ admin.id }}</td>
            <td class="px-6 py-4">
              <div class="font-medium">{{ admin.username }}</div>
            </td>
            <td class="px-6 py-4 text-sm">{{ admin.email }}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-sm"
                      :class="{
                        'bg-purple-100 text-purple-800': admin.role === 'superadmin',
                        'bg-blue-100 text-blue-800': admin.role === 'admin',
                        'bg-green-100 text-green-800': admin.role === 'moderator'
                      }">
                  {{ admin.role }}
                </span>
            </td>
            <td class="px-6 py-4 text-sm">{{ formatDate(admin.last_login) }}</td>
            <td class="px-6 py-4 text-sm">{{ formatDate(admin.created_at) }}</td>
            <td class="px-6 py-4">
              <div class="flex space-x-2">
                <button @click="editAdmin(admin)" class="text-blue-600 hover:text-blue-800">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                    v-if="admin.id !== currentAdminId"
                    @click="confirmDelete(admin)"
                    class="text-red-600 hover:text-red-800"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        Администраторы не найдены
      </div>
    </div>

    <!-- Модалка добавления/редактирования -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <h2 class="text-xl font-bold mb-4">{{ showEditModal ? 'Редактировать администратора' : 'Добавить администратора' }}</h2>

          <form @submit.prevent="saveAdmin">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">
                Имя пользователя
              </label>
              <input v-model="adminForm.username" type="text" required
                     class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input v-model="adminForm.email" type="email" required
                     class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>

            <div v-if="!showEditModal" class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">
                Пароль
              </label>
              <input v-model="adminForm.password" type="password" required minlength="6"
                     class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              <p class="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">
                Роль
              </label>
              <select v-model="adminForm.role"
                      class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="admin">Администратор</option>
                <option value="moderator">Модератор</option>
                <option value="superadmin">Супер администратор</option>
              </select>
            </div>

            <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {{ error }}
            </div>

            <div class="flex justify-end space-x-2">
              <button type="button" @click="closeModals"
                      class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
                Отмена
              </button>
              <button type="submit" :disabled="saving"
                      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50">
                {{ saving ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Модалка подтверждения удаления -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">Подтверждение удаления</h2>
        <p class="text-gray-600 mb-6">
          Вы уверены, что хотите удалить администратора "{{ selectedAdmin?.username }}"?
          Это действие нельзя отменить.
        </p>
        <div class="flex justify-end space-x-2">
          <button @click="showDeleteModal = false"
                  class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
            Отмена
          </button>
          <button @click="deleteAdmin" :disabled="deleting"
                  class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { adminApi } from '../../api/admin.client';

const admins = ref([]);
const loading = ref(true);
const currentAdminId = ref(null);

// Модалки
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedAdmin = ref(null);
const saving = ref(false);
const deleting = ref(false);
const error = ref('');

// Форма
const adminForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'admin'
});

const formatDate = (date) => {
  if (!date) return 'никогда';
  return new Date(date).toLocaleString('ru-RU');
};

const loadAdmins = async () => {
  loading.value = true;
  try {
    const response = await adminApi.getAllAdmins();
    admins.value = response.data || [];

    // Получаем ID текущего админа
    const current = await adminApi.getCurrentAdmin();
    currentAdminId.value = current.data.id;
  } catch (error) {
    console.error('Error loading admins:', error);
  } finally {
    loading.value = false;
  }
};

const editAdmin = (admin) => {
  selectedAdmin.value = admin;
  adminForm.value = {
    username: admin.username,
    email: admin.email,
    role: admin.role,
    password: '' // Не заполняем пароль при редактировании
  };
  showEditModal.value = true;
};

const confirmDelete = (admin) => {
  selectedAdmin.value = admin;
  showDeleteModal.value = true;
};

const closeModals = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  adminForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'admin'
  };
  error.value = '';
};

const saveAdmin = async () => {
  saving.value = true;
  error.value = '';

  try {
    if (showEditModal.value) {
      // Обновление администратора
      await adminApi.updateAdmin(selectedAdmin.value.id, {
        username: adminForm.value.username,
        email: adminForm.value.email,
        role: adminForm.value.role
      });
    } else {
      // Создание администратора
      await adminApi.createAdmin({
        username: adminForm.value.username,
        email: adminForm.value.email,
        password: adminForm.value.password,
        role: adminForm.value.role
      });
    }
    closeModals();
    loadAdmins();
  } catch (err) {
    error.value = err.message || 'Ошибка при сохранении';
  } finally {
    saving.value = false;
  }
};

const deleteAdmin = async () => {
  deleting.value = true;
  try {
    await adminApi.deleteAdmin(selectedAdmin.value.id);
    showDeleteModal.value = false;
    loadAdmins();
  } catch (error) {
    console.error('Error deleting admin:', error);
    alert('Ошибка при удалении');
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  loadAdmins();
});
</script>