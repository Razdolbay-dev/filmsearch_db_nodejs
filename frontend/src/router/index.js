import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MoviesView from '../views/MoviesView.vue';
import MovieDetailView from '../views/MovieDetailView.vue';
import SeriesView from '../views/SeriesView.vue';
import SeriesDetailView from '../views/SeriesDetailView.vue';

const routes = [
  { path: '/', component: HomeView },
  { path: '/movies', component: MoviesView },
  { path: '/movies/:id', component: MovieDetailView },
  { path: '/movies/search', component: MoviesView, props: (route) => ({ searchQuery: route.query.q }) },
  { path: '/series', component: SeriesView },
  { path: '/series/:id', component: SeriesDetailView },
  { path: '/series/search', component: SeriesView, props: (route) => ({ searchQuery: route.query.q }) },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;