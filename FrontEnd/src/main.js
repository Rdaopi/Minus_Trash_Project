// Importo gli stili di base dell'applicazione
import './assets/main.css'

// Importo le funzionalità essenziali di Vue
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Utilizzo bootstrap per avere già componenti stilizzati
import 'bootstrap/dist/css/bootstrap.min.css'
// Ho dovuto reimportarlo perché a volte ci sono conflitti
import './assets/main.css'

// Creo l'app e la monto sull'elemento con id 'app'
createApp(App)
  .use(router)
  .mount('#app') 