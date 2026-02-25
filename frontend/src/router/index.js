import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import MoviesView from '@/views/MoviesView.vue';
import MovieDetailView from '@/views/MovieDetailView.vue';
import SeriesView from '@/views/SeriesView.vue';
import SeriesDetailView from '@/views/SeriesDetailView.vue';
import CartoonsView from '@/views/CartoonsView.vue';
import adminRoutes from './admin.routes';
import {adminApi} from "@/api/admin.client.js";

const routes = [
  // Публичные маршруты
  { path: '/', component: HomeView },
  { path: '/movies', component: MoviesView },
  { path: '/movies/:id', component: MovieDetailView },
  { path: '/movies/search', component: MoviesView, props: (route) => ({ searchQuery: route.query.q }) },
  { path: '/series', component: SeriesView },
  { path: '/series/:id', component: SeriesDetailView },
  { path: '/series/search', component: SeriesView, props: (route) => ({ searchQuery: route.query.q }) },
  { path: '/cartoons', component: CartoonsView },
  { path: '/cartoons/search', component: CartoonsView, props: (route) => ({ searchQuery: route.query.q })
  },
  // Маршруты админки
  ...adminRoutes,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// **УЛУЧШЕННЫЙ guard с отладкой**
router.beforeEach(async (to, from, next) => {
  console.log('🛣️ Navigation:', { from: from.path, to: to.path });

  // Проверяем, требует ли маршрут авторизации
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    console.log('🔒 Protected route detected');

    try {
      // Проверяем авторизацию
      console.log('🔍 Checking admin auth...');
      const response = await adminApi.getCurrentAdmin();
      console.log('📦 Auth check response:', response);

      if (response.success) {
        console.log('✅ Admin authenticated:', response.data);

        // Проверка на superadmin если требуется
        if (to.meta.requiresSuperAdmin && response.data.role !== 'superadmin') {
          console.log('⛔ Insufficient permissions');
          next('/admin/dashboard');
          return;
        }

        next();
      } else {
        console.log('❌ Not authenticated, redirecting to login');
        next('/admin/login');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      next('/admin/login');
    }
  } else {
    console.log('🌐 Public route, proceeding');
    next();
  }
});

export default router;