import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

// Definisco le rotte dell'applicazione
// Utilizzo il lazy-loading per caricare le pagine solo quando servono
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue') // Pagina principale
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/Map.vue') // Pagina della mappa interattiva
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/Auth.vue') // Pagina login/registrazione
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue') // Pagina area personale
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue')
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue')
  },
  // TODO: Aggiungere pagina contatti
]

// Determine if we should use hash mode based on URL
const useHashMode = window.location.href.includes('/#/');

// Creo il router con la history API per URL più puliti o hash mode se necessario
const router = createRouter({
  history: useHashMode ? createWebHashHistory(import.meta.env.BASE_URL) : createWebHistory(import.meta.env.BASE_URL),
  routes
})

// In futuro qui potrei aggiungere controlli di accesso (guards)

// Route guard: protect /profile from unauthenticated access
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (to.path === '/profile' && !isAuthenticated) {
    next('/auth');
  } else {
    next();
  }
});

export default router 