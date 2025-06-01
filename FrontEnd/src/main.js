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

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icons issue with Vite
import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

// Creo l'app e la monto sull'elemento con id 'app'
createApp(App)
  .use(router)
  .mount('#app') 