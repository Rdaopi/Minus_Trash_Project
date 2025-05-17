<template>
  <div class="app">
    <header class="header">
      <div class="logo">
        <span class="logo-text">Minus<span class="highlight">Trash</span></span>
      </div>
      <nav class="nav-menu">
        <router-link to="/" class="nav-link">
          <i class="fas fa-home"></i> Home
        </router-link>
        <router-link to="/map" class="nav-link">
          <i class="fas fa-map-marker-alt"></i> Mappa
        </router-link>
        <router-link to="/auth" class="nav-link">
          <i class="fas fa-user"></i> Login
        </router-link>
      </nav>
    </header>
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <footer class="footer">
      <p>&copy; 2025 MinusTrash - Per un mondo più pulito</p>
    </footer>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
// Il componente principale che gestisce la struttura dell'app
// Ho usato setup script per semplicità
</script>

<style>
/* Ho importato Leaflet per la mappa e Font Awesome per le icone */
@import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
@import 'bootstrap/dist/css/bootstrap.min.css';

/* Variabili CSS per mantenere coerenza nei colori */
:root {
  --primary-color: #4CAF50; /* verde principale */
  --secondary-color: #2E7D32; /* verde più scuro */
  --accent-color: #81C784; /* verde più chiaro */
  --background-color: #F5F5F5; /* grigio chiaro */
  --text-color: #333333; /* quasi nero */
}

/* Stile di base */
body {
  margin: 0;
  font-family: 'Poppins', sans-serif; 
  background-color: var(--background-color);
  color: var(--text-color);
}

/* Header con logo e menu */
.header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Stile del logo */
.logo-text {
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
}

/*colore logo */
.highlight {
  color: #FFD700; /* oro */
}

/* Menu di navigazione */
.nav-menu {
  display: flex;
  gap: 2rem;
}

/*Link di navigazione */
.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
}

/*Effetto hover sui link */
.nav-link:hover {
  background-color: rgba(255,255,255,0.1);
  transform: translateY(-2px);
}

/*Link attivo */
.nav-link.router-link-active {
  background-color: rgba(255,255,255,0.2);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Contenuto principale */
.main-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  min-height: calc(100vh - 180px); /* per footer in fondo */
}

/*Footer*/
.footer {
  background-color: var(--secondary-color);
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: 2rem;
}

/*Animazioni di transizione tra le pagine */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/*Adattamento per responsive*/
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }

  .nav-menu {
    margin-top: 1rem;
    gap: 1rem;
  }

  .logo-text {
    font-size: 1.5rem;
  }
}
</style>