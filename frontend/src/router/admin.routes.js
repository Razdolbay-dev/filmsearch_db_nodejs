export default [
    {
        path: '/admin/login',
        name: 'admin-login',
        component: () => import('../views/admin/LoginView.vue'),
        meta: { layout: 'empty' }
    },
    {
        path: '/admin',
        component: () => import('../components/admin/AdminLayout.vue'),
        meta: { requiresAdmin: true },
        children: [
            {
                path: 'dashboard',
                name: 'admin-dashboard',
                component: () => import('../views/admin/DashboardView.vue')
            },
            {
                path: 'movies',
                name: 'admin-movies',
                component: () => import('../views/admin/MoviesView.vue')
            },
            {
                path: 'series',
                name: 'admin-series',
                component: () => import('../views/admin/SeriesView.vue')
            },
            {
                path: 'admins',
                name: 'admin-admins',
                component: () => import('../views/admin/AdminsView.vue'),
                meta: { requiresSuperAdmin: true }
            },
            {
                path: 'sync',  // <-- НОВЫЙ МАРШРУТ
                name: 'admin-sync',
                component: () => import('../views/admin/SyncView.vue')
            }
        ]
    }
];