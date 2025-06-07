import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { requireOperator } from './guards'
import { jwtDecode } from 'jwt-decode';

// Function to check if user is admin
const requireAdmin = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (!token) {
    next('/auth');
    return;
  }

  try {
    const decoded = jwtDecode(token);
    if (decoded && decoded.role === 'amministratore') {
      next();
    } else {
      next('/profile');
    }
  } catch (error) {
    console.error('Error verifying admin status:', error);
    next('/auth');
  }
};

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
    path: '/messaggi',
    name: 'Messaggi',
    component: () => import('../views/Messaggi.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/Auth.vue') // Pagina login/registrazione
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'), // Pagina area personale
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/bin-management',
    name: 'BinManagement',
    component: () => import('../views/BinManagement.vue'),
    meta: {
      requiresAuth: true,
      requiresOperator: true
    },
    beforeEnter: requireOperator
  },
  {
    path: '/report-management',
    name: 'ReportManagement',
    component: () => import('../views/ReportManagement.vue'),
    meta: {
      requiresAuth: true,
      requiresOperator: true
    },
    beforeEnter: requireOperator
  },
  {
    path: '/account-management',
    name: 'AccountManagement',
    component: () => import('../views/AccountManagement.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    },
    beforeEnter: requireAdmin
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
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('../views/ChangePassword.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: () => import('../views/EditProfile.vue')
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

// Route guard: protect routes and check roles
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  // Se la rotta richiede autenticazione
  if (to.meta.requiresAuth && !token) {
    next('/auth');
    return;
  }

  // Se c'è un token, verifichiamo che sia valido
  if (token) {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Se il token è scaduto, rimuoviamo tutto e reindirizziamo al login
      if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        if (to.meta.requiresAuth) {
          next('/auth');
          return;
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      if (to.meta.requiresAuth) {
        next('/auth');
        return;
      }
    }
  }

  next();
});

export default router 