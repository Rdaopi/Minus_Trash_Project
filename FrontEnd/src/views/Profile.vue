<template>
  <div class="profile-container">
    <div class="profile-card">
      <h2>Area Personale</h2>
      <p>Benvenuto, <strong>{{ userEmail }}</strong>!</p>
      
      <div v-if="isGoogleUser" class="google-user-message">
        <i class="fas fa-info-circle"></i>
        <p>Hai effettuato l'accesso con Google. Per modificare la password, utilizza le impostazioni del tuo account Google.</p>
      </div>
      
      <div v-else>
        <ChangePassword @password-changed="handlePasswordChange" />
      </div>
      
      <Notification
        :show="showNotification"
        :message="notificationMessage"
        :type="notificationType"
      />
      
      <button class="logout-button" @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ChangePassword from '../components/ChangePassword.vue';
import Notification from '../components/Notification.vue';
import { authAPI } from '../services/api.js';

const router = useRouter();
const userEmail = ref(localStorage.getItem('userEmail') || 'utente');
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('success');

// Check if user is a Google user by looking at the auth method and email domain
const isGoogleUser = computed(() => {
  const authMethod = localStorage.getItem('authMethod');
  const email = userEmail.value;
  console.log('Current auth method:', authMethod, 'Email:', email);
  
  // If authMethod is not set, fallback to checking email domain
  if (!authMethod) {
    // Set authMethod based on email domain for existing sessions
    const isGoogle = email && email.endsWith('@gmail.com');
    if (isGoogle) {
      localStorage.setItem('authMethod', 'google');
    } else if (email) {
      localStorage.setItem('authMethod', 'regular');
    }
    return isGoogle;
  }
  
  return authMethod === 'google';
});

// Check auth method on component mount
onMounted(() => {
  const authMethod = localStorage.getItem('authMethod');
  const email = localStorage.getItem('userEmail');
  console.log('On mount - Auth method:', authMethod, 'Email:', email);
  
  // Set auth method if not already set
  if (!authMethod && email) {
    const isGoogle = email.endsWith('@gmail.com');
    localStorage.setItem('authMethod', isGoogle ? 'google' : 'regular');
  }
});

// Watch for changes in localStorage
window.addEventListener('storage', () => {
  console.log('Storage changed, updating auth method');
  userEmail.value = localStorage.getItem('userEmail') || 'utente';
});

async function logout() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch (error) {
        console.error('Logout server request failed:', error);
        // Continue with local cleanup even if server request fails
      }
    }
  } finally {
    // Always clean up local storage, even if server request fails
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authMethod');
    router.push('/auth');
  }
}

function handlePasswordChange({ type, message }) {
  notificationType.value = type;
  notificationMessage.value = message;
  showNotification.value = true;
  
  // Hide notification after 4 seconds
  setTimeout(() => {
    showNotification.value = false;
  }, 4000);
}
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px);
  background-color: #f5f5f5;
}

.profile-card {
  background: white;
  padding: 2rem 3rem;
  border-radius: 2.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  text-align: center;
  width: 100%;
  max-width: 600px;
}

.logout-button {
  margin-top: 2rem;
  padding: 0.8rem 2rem;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 8rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-button:hover {
  background-color: #b71c1c;
}

.google-user-message {
  background-color: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 2.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.google-user-message i {
  color: #1976d2;
  font-size: 1.5rem;
}

.google-user-message p {
  margin: 0;
  color: #1565c0;
  text-align: left;
}
</style> 