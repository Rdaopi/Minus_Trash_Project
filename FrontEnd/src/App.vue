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
        <router-link to="/messaggi" class="nav-link" v-if="isLoggedIn">
          <i class="fas fa-envelope"></i> Messaggi
          <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
        </router-link>
        <router-link to="/map" class="nav-link">
          <i class="fas fa-map-marker-alt"></i> Mappa
        </router-link>
        <router-link
          v-if="isLoggedIn"
          to="/profile"
          class="nav-link"
        >
          <i class="fas fa-user"></i> Area Personale
        </router-link>
        <router-link
          v-else
          to="/auth"
          class="nav-link"
        >
          <i class="fas fa-user"></i> Login
        </router-link>
      </nav>
    </header>
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" @login-success="updateAuthState" />
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
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isLoggedIn = ref(false)
const unreadCount = ref(0)

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

// Function to check token validity and update login state
const checkTokenValidity = () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!token) {
    isLoggedIn.value = false;
    return;
  }

  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000;
    const currentTime = Date.now();
    
    if (currentTime >= expirationTime) {
      // Token is expired, check refresh token
      if (refreshToken) {
        isLoggedIn.value = true; // Keep logged in while we have refresh token
      } else {
        clearAuthData();
        isLoggedIn.value = false;
      }
    } else {
      // Token is still valid
      isLoggedIn.value = true;
    }
  } catch (error) {
    console.error('Error checking token validity:', error);
    if (refreshToken) {
      isLoggedIn.value = true; // Keep logged in if we have refresh token
    } else {
      // Check if token is still valid despite parse error
      isLoggedIn.value = !!token;
    }
  }
}

// Clear auth data helper
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('authMethod');
  isLoggedIn.value = false;
}

// Update isLoggedIn when localStorage changes
window.addEventListener('storage', () => {
  checkTokenValidity();
})

// Function to update auth state
const updateAuthState = () => {
  checkTokenValidity();
  if (isLoggedIn.value) {
    fetchUnreadCount();
  }
}

// Watch for route changes
watch(route, () => {
  updateAuthState();
  if (route.path === '/messaggi') {
    fetchUnreadCount();
  }
})

// Check on mount
onMounted(() => {
  updateAuthState();
  if (isLoggedIn.value) {
    fetchUnreadCount();
  }
})

// Check periodically for token expiration
let pollInterval;
onMounted(() => {
  pollInterval = setInterval(() => {
    if (isLoggedIn.value) {
      fetchUnreadCount();
    }
  }, 30000); // Check every 30 seconds
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
})

// Function to fetch unread message count
const fetchUnreadCount = async () => {
  if (!isLoggedIn.value) {
    unreadCount.value = 0;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/messages/unread/count`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      unreadCount.value = data.count;
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
  }
};
</script>

<style>
/* Ho importato Leaflet per la mappa e Font Awesome per le icone */
@import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
@import 'bootstrap/dist/css/bootstrap.min.css';

/* Variabili CSS per mantenere coerenza nei colori */
:root {
  --primary-color: #4CAF50; /* verde principale */
  --secondary-color: #2E7D32; /* verde più scuro #*/
  --accent-color: #81C784; /* verde più chiaro */
  --background-color: #fff; 
  --background2-color: #f8fdff; /* blue chiaro f8fdff */
  --background-hover-color:#388e3c;
  --text-color: #333333; /* quasi nero */
  --white-color: #fff;
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
  border: 2px solid var(--primary-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 2.5rem 2.5rem 0 0;
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
  background-color: var(--white-color);
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: 8rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.75rem 1.75rem !important;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.12);
  position: relative;
  overflow: hidden;
  outline: none;
  text-decoration: none;
  z-index: 1;
}

.nav-link:hover, .nav-link:focus {
  background-color: #4CAF50;
  color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.18);
  border-color: #388e3c;
}

.nav-link.router-link-active {
  background-color: var(--white-color);
  border: 2px solid var(--primary-color);
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.18), 0 2px 8px rgba(76, 175, 80, 0.10);
  z-index: 2;
}

/* Contenuto principale */
.main-content {
  max-width: 1200px;
  margin: 2rem auto;
  background-color: var(--white-color);
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
  border-radius: 0 0 2.5rem 2.5rem;
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

.app {
  border: 2px solid #e0e0e0;
  border-radius: 2.5rem;
  background: #f8fdff;
  overflow: hidden;
  max-width: 1280px;
  margin: 2rem auto;
  box-shadow: 0 5px 20px rgba(0, 212, 255, 0.08);
}

/* Notification badge */
.notification-badge {
  position: absolute;
  top: 0px;
  
  right: 8px;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transform: translate(-10%, 50%);
}

.nav-link {
  position: relative;
}
</style>