<template>
  <div>
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Управление фильмами</h1>
      <button
          @click="showAddModal = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Добавить фильм
      </button>
    </div>

    <!-- Поиск и фильтры -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <input
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="Поиск по названию..."
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div class="flex gap-2">
          <select
              v-model="filterYear"
              @change="applyYearFilter"
              class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Все года</option>
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
          <select
              v-model="filterGenre"
              @change="applyGenreFilter"
              class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Все жанры</option>
            <option v-for="genre in genres" :key="genre.id" :value="genre.id">{{ genre.name }}</option>
          </select>

          <!-- Кнопка сброса фильтров -->
          <button
              v-if="searchQuery || filterYear || filterGenre"
              @click="clearFilters"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition flex items-center"
              title="Сбросить все фильтры"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Таблица фильмов -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="movies.length" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Постер</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Страна</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Год</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Рейтинг</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Популярность</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
          <tr v-for="movie in movies" :key="movie.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-500">{{ movie.id }}</td>
            <td class="px-6 py-4">
              <img v-if="movie.poster_path"
                   :src="`/images/posters${movie.poster_path}`"
                   class="w-12 h-16 object-cover rounded">
              <div v-else class="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="font-medium"><a @click="goToMovieDetails(movie.id)" class="cursor-pointer hover:text-blue-600">{{ movie.title }}</a></div>
              <div class="text-sm text-gray-500">{{ movie.original_title }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="ext-sm text-gray-500">{{ movie.original_language }}</div>
            </td>
            <td class="px-6 py-4 text-sm">{{ movie.release_date?.split('-')[0] || 'N/A' }}</td>
            <td class="px-6 py-4">
                <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                  ★ {{ Number(movie.vote_average).toFixed(1) }}
                </span>
            </td>
            <td class="px-6 py-4 text-sm">{{ Number(movie.popularity).toFixed(1) }}</td>
            <td class="px-6 py-4">
              <div class="flex space-x-2">
                <button @click="editMovie(movie)" class="text-blue-600 hover:text-blue-800">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="confirmDelete(movie)" class="text-red-600 hover:text-red-800">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <!-- Кнопка исключения фильма -->
                <button @click="excludeMovie(movie)"
                        class="text-orange-600 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="excludingMovieId === movie.id"
                        title="Исключить из синхронизации (добавить в blacklist)">
                  <svg v-if="excludingMovieId === movie.id" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

        <!-- Пагинация -->
        <div class="px-6 py-4 border-t">
          <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="changePage"
          />
        </div>
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        Фильмы не найдены
      </div>
    </div>

    <!-- Модалка добавления/редактирования -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h2 class="text-xl font-bold mb-4">{{ showEditModal ? 'Редактировать фильм' : 'Добавить фильм' }}</h2>

          <form @submit.prevent="saveMovie">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-gray-700 text-sm font-bold mb-2">TMDB ID</label>
                <input v-model="movieForm.tmdb_id" type="number" required
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div class="col-span-2">
                <label class="block text-gray-700 text-sm font-bold mb-2">Название</label>
                <input v-model="movieForm.title" type="text" required
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div class="col-span-2">
                <label class="block text-gray-700 text-sm font-bold mb-2">Оригинальное название</label>
                <input v-model="movieForm.original_title" type="text"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Дата релиза</label>
                <input v-model="movieForm.release_date" type="date"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Длительность (мин)</label>
                <input v-model="movieForm.runtime" type="number"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div class="col-span-2">
                <label class="block text-gray-700 text-sm font-bold mb-2">Описание</label>
                <textarea v-model="movieForm.overview" rows="3"
                          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"></textarea>
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Бюджет</label>
                <input v-model="movieForm.budget" type="number"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Сборы</label>
                <input v-model="movieForm.revenue" type="number"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Язык</label>
                <input v-model="movieForm.original_language" type="text" maxlength="2"
                       class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
              </div>

              <div>
                <label class="block text-gray-700 text-sm font-bold mb-2">Статус</label>
                <select v-model="movieForm.status"
                        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="Rumored">Rumored</option>
                  <option value="Planned">Planned</option>
                  <option value="In Production">In Production</option>
                  <option value="Post Production">Post Production</option>
                  <option value="Released">Released</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end space-x-2 mt-6">
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
          Вы уверены, что хотите удалить фильм "{{ selectedMovie?.title }}"?
          Это действие нельзя отменить.
        </p>
        <div class="flex justify-end space-x-2">
          <button @click="showDeleteModal = false"
                  class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
            Отмена
          </button>
          <button @click="deleteMovie" :disabled="deleting"
                  class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50">
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { adminApi } from '@/api/admin.client';
import { apiClient } from '@/api/client';
import Pagination from '@/components/Pagination.vue';
import { debounce } from 'lodash-es';
import { excludeApi } from "@/api/content.client.js";

const router = useRouter();
const route = useRoute();

// Состояние
const movies = ref([]);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const searchQuery = ref('');
const filterYear = ref('');
const filterGenre = ref('');
const selectedMovie = ref(null);

// Состояние для отслеживания исключаемого фильма
const excludingMovieId = ref(null);

// Данные для фильтров
const years = ref([]);
const genres = ref([]);

// Модалки
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);

// Форма
const movieForm = ref({
  tmdb_id: '',
  title: '',
  original_title: '',
  release_date: '',
  runtime: '',
  overview: '',
  budget: '',
  revenue: '',
  original_language: '',
  status: 'Released'
});

// ИНИЦИАЛИЗАЦИЯ ИЗ QUERY ПАРАМЕТРОВ
const initFromQuery = () => {
  const query = route.query;

  // Восстанавливаем страницу
  if (query.page) {
    currentPage.value = parseInt(query.page);
  } else {
    currentPage.value = 1;
  }

  // Восстанавливаем поиск
  if (query.search) {
    searchQuery.value = query.search;
  } else {
    searchQuery.value = '';
  }

  // Восстанавливаем фильтр по году
  if (query.year) {
    filterYear.value = query.year;
  } else {
    filterYear.value = '';
  }

  // Восстанавливаем фильтр по жанру
  if (query.genre) {
    filterGenre.value = query.genre;
  } else {
    filterGenre.value = '';
  }

  console.log('📌 Movies: инициализация из URL:', {
    page: currentPage.value,
    search: searchQuery.value,
    year: filterYear.value,
    genre: filterGenre.value
  });
};

// ОБНОВЛЕНИЕ QUERY ПАРАМЕТРОВ
const updateQueryParams = () => {
  const query = {};

  if (currentPage.value > 1) {
    query.page = currentPage.value;
  }

  if (searchQuery.value) {
    query.search = searchQuery.value;
  }

  if (filterYear.value) {
    query.year = filterYear.value;
  }

  if (filterGenre.value) {
    query.genre = filterGenre.value;
  }

  console.log('🔄 Movies: обновление URL:', query);

  router.replace({ query });
};

const formatLanguages = (languages) => {
  if (!languages || !languages.length) return 'N/A';
  return languages.map(l => l.english_name || l.name).join(', ');
};

// Загрузка фильмов
const loadMovies = async (page = currentPage.value) => {
  loading.value = true;
  try {
    let response;

    if (searchQuery.value) {
      // Поиск
      console.log('🔍 Поиск фильмов:', searchQuery.value);
      response = await apiClient.searchMovies(searchQuery.value, page);
    } else if (filterYear.value) {
      // Фильтр по году
      console.log('📅 Фильтр по году:', filterYear.value);
      response = await apiClient.getMoviesByYear(filterYear.value, page);
    } else if (filterGenre.value) {
      // Фильтр по жанру
      console.log('🎭 Фильтр по жанру:', filterGenre.value);
      response = await apiClient.getMoviesByGenre(filterGenre.value, page);
    } else {
      // Все фильмы
      console.log('📋 Все фильмы, страница:', page);
      response = await apiClient.getMovies(page);
    }

    if (response.success) {
      movies.value = response.data.data || [];
      totalPages.value = response.data.pagination?.pages || 1;
      currentPage.value = page;
    }
  } catch (error) {
    console.error('Error loading movies:', error);
  } finally {
    loading.value = false;
  }
};

// Загрузка данных для фильтров
const loadFilterData = async () => {
  try {
    // Генерируем года (последние 20 лет)
    const currentYear = new Date().getFullYear();
    years.value = Array.from({ length: 20 }, (_, i) => currentYear - i);

    // Жанры
    genres.value = [
      { id: 28, name: 'Боевик' },
      { id: 12, name: 'Приключения' },
      { id: 16, name: 'Анимация' },
      { id: 35, name: 'Комедия' },
      { id: 80, name: 'Криминал' },
      { id: 99, name: 'Документальный' },
      { id: 18, name: 'Драма' },
      { id: 10751, name: 'Семейный' },
      { id: 14, name: 'Фэнтези' },
      { id: 36, name: 'История' },
      { id: 27, name: 'Ужасы' },
      { id: 10402, name: 'Музыка' },
      { id: 9648, name: 'Детектив' },
      { id: 10749, name: 'Мелодрама' },
      { id: 878, name: 'Фантастика' },
      { id: 10770, name: 'ТВ фильм' },
      { id: 53, name: 'Триллер' },
      { id: 10752, name: 'Военный' },
      { id: 37, name: 'Вестерн' }
    ];
  } catch (error) {
    console.error('Error loading filter data:', error);
  }
};

// Обработчики
const goToMovieDetails = (id) => {
  router.push(`/movies/${id}`);
};

const handleSearch = () => {
  currentPage.value = 1;
  filterYear.value = '';
  filterGenre.value = '';
  updateQueryParams();
  loadMovies(1);
};

const debouncedSearch = debounce(() => {
  handleSearch();
}, 500);

const applyYearFilter = () => {
  currentPage.value = 1;
  searchQuery.value = '';
  filterGenre.value = '';
  updateQueryParams();
  loadMovies(1);
};

const applyGenreFilter = () => {
  currentPage.value = 1;
  searchQuery.value = '';
  filterYear.value = '';
  updateQueryParams();
  loadMovies(1);
};

const clearFilters = () => {
  searchQuery.value = '';
  filterYear.value = '';
  filterGenre.value = '';
  currentPage.value = 1;
  updateQueryParams();
  loadMovies(1);
};

const changePage = (page) => {
  currentPage.value = page;
  updateQueryParams();
  loadMovies(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// CRUD операции
const editMovie = (movie) => {
  selectedMovie.value = movie;
  movieForm.value = { ...movie };
  showEditModal.value = true;
};

const confirmDelete = (movie) => {
  selectedMovie.value = movie;
  showDeleteModal.value = true;
};

const closeModals = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  movieForm.value = {
    tmdb_id: '',
    title: '',
    original_title: '',
    release_date: '',
    runtime: '',
    overview: '',
    budget: '',
    revenue: '',
    original_language: '',
    status: 'Released'
  };
};

const saveMovie = async () => {
  saving.value = true;
  try {
    if (showEditModal.value) {
      // TODO: Обновление фильма
      // await adminApi.updateMovie(selectedMovie.value.id, movieForm.value);
      console.log('Update movie:', selectedMovie.value.id, movieForm.value);
    } else {
      // TODO: Создание фильма
      // await adminApi.createMovie(movieForm.value);
      console.log('Create movie:', movieForm.value);
    }
    closeModals();
    loadMovies(currentPage.value);
  } catch (error) {
    console.error('Error saving movie:', error);
    alert('Ошибка при сохранении');
  } finally {
    saving.value = false;
  }
};

const deleteMovie = async () => {
  deleting.value = true;
  try {
    // TODO: Удаление фильма
    // await adminApi.deleteMovie(selectedMovie.value.id);
    console.log('Delete movie:', selectedMovie.value.id);
    showDeleteModal.value = false;
    loadMovies(currentPage.value);
  } catch (error) {
    console.error('Error deleting movie:', error);
    alert('Ошибка при удалении');
  } finally {
    deleting.value = false;
  }
};

// Метод исключения фильма
const excludeMovie = async (movie) => {
  // Спрашиваем подтверждение
  const confirmed = await new Promise((resolve) => {
    if (confirm(`Вы уверены, что хотите исключить фильм "${movie.title}" из синхронизации?\n\nЭто действие:\n• Удалит фильм из базы данных\n• Добавит его TMDB ID в blacklist\n• При следующей синхронизации он не загрузится`)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });

  if (!confirmed) return;

  // Устанавливаем ID исключаемого фильма для отображения спиннера
  excludingMovieId.value = movie.id;

  try {
    const response = await excludeApi.excludeMovie(movie.id);

    if (response.success) {
      // Убираем фильм из текущего списка
      movies.value = movies.value.filter(m => m.id !== movie.id);

      // Можно показать уведомление (если есть система уведомлений)
      alert('✅ Фильм успешно исключён из синхронизации');
    } else {
      throw new Error(response.message || 'Ошибка при исключении');
    }
  } catch (error) {
    console.error('Error excluding movie:', error);
    alert(`❌ Ошибка: ${error.message}`);
  } finally {
    // Сбрасываем ID исключаемого фильма
    excludingMovieId.value = null;
  }
};

// Следим за изменениями query параметров
watch(() => route.query, (newQuery) => {
  console.log('🔍 Movies: изменение query:', newQuery);

  // Проверяем, нужно ли перезагружать данные
  const shouldReload =
      String(newQuery.page || '1') !== String(currentPage.value) ||
      (newQuery.search || '') !== searchQuery.value ||
      (newQuery.year || '') !== filterYear.value ||
      (newQuery.genre || '') !== filterGenre.value;

  if (shouldReload) {
    initFromQuery();
    loadMovies(currentPage.value);
  }
}, { deep: true });

// Инициализация при монтировании
onMounted(async () => {
  await loadFilterData();
  initFromQuery();
  await loadMovies(currentPage.value);
});
</script>