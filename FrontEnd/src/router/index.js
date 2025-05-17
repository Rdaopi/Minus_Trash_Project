import { createRouter, createWebHistory} from 'vue-router'

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
  // TODO: Aggiungere pagina profilo utente
  // TODO: Aggiungere pagina contatti
]

// Creo il router con la history API per URL più puliti
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// In futuro qui potrei aggiungere controlli di accesso (guards)

export default router 