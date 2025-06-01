<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1>{{ isAdmin ? 'Amministratore' : 'Area Personale' }}</h1>
      <p>Benvenuto, <strong>{{ userEmail }}</strong>{{ isAdmin ? ' (Amministratore)' : '' }}!</p>
      
      <div v-if="isGoogleUser" class="google-user-message">
        <i class="fas fa-info-circle"></i>
        <p>Hai effettuato l'accesso con Google. Per modificare la password, utilizza le impostazioni del tuo account Google.</p>
      </div>
      
      <div v-else>
        <button class="change-password-button" @click="goToChangePassword">
          Cambia Password
        </button>
      </div>
      <div class="buttons-container">
        <button v-if="isOperator || isAdmin" class="manage-bins-button" @click="goToBinManagement">
          Gestione Cestini
        </button>
        <button v-if="isAdmin" class="manage-account-button" @click="goToAccountManagement">
          Gestione Account
        </button>
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
import Notification from '../components/Notification.vue';
import { authAPI } from '../services/api.js';
import { jwtDecode } from 'jwt-decode';

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

// Computed property to check if user is operator
const isOperator = computed(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/auth');
    return false;
  }
  
  try {
    const decoded = jwtDecode(token);
    return decoded && decoded.role === 'operatore_comunale';
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    router.push('/auth');
    return false;
  }
});
// Computed property to check if user is admin
const isAdmin = computed(() => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    return decoded && decoded.role === 'amministratore';
  } catch (error) {
    console.error('Error decoding token:', error);
    return false;
  }
});

// Check auth method on component mount
onMounted(() => {
  const authMethod = localStorage.getItem('authMethod');
  const email = localStorage.getItem('userEmail');
  console.log('On mount - Auth method:', authMethod, 'Email:', email);
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/auth');
    return;
  }

  try {
    const decoded = jwtDecode(token);
    if (!decoded) {
      throw new Error('Token non valido');
    }
  } catch (error) {
    console.error('Error validating token:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    router.push('/auth');
  }
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
    localStorage.removeItem('userRole');
    router.push('/auth');
  }
}

function goToBinManagement() {
  router.push('/bin-management');
}

function goToAccountManagement() {
  router.push('/account-management');
}

function goToChangePassword() {
  router.push('/change-password');
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
.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}
.change-password-button {
  padding: 0.8rem 2rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
  margin: 0.2rem auto;
  display: block;
  width: 100%;
  max-width: 300px;
}
.change-password-button:hover {
  background-color: var(--background-hover-color);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  animation: pulseGlow 1.5s infinite;
  outline: none;
}
.logout-button {
  padding: 0.8rem 2rem;
  background-color: #e53935;
  color: white;
  border: none;
  border-radius: 8rem;
  font-size: 1rem;
  margin: 1rem auto;
  cursor: pointer;
  width: 100%;
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

@keyframes pulseGlow {
  0% {
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  }
  50% {
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.6);
  }
  100% {
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  }
}
.manage-bins-button {
  padding: 0.8rem 2rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
  margin: 0.2rem auto;
  display: block;
  width: 100%;
  max-width: 300px;

}
.manage-bins-button:hover {
  background-color: var(--background-hover-color);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  animation: pulseGlow 1.5s infinite;
  outline: none;
}
.manage-account-button {
  padding: 0.8rem 2rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
  margin: 0.2rem auto;
  display: block;
  width: 100%;
  max-width: 300px;
}
.manage-account-button:hover {
  background-color: #1976D2;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  animation: pulseGlow 1.5s infinite;
  outline: none;
}
</style>