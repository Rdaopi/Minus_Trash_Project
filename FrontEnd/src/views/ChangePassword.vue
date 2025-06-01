<template>
  <div class="change-password-page">
    <div class="change-password-card">
      <h1>Cambia Password</h1>
      <p>Modifica la tua password di accesso</p>
      
      <div v-if="isGoogleUser" class="google-user-message">
        <i class="fas fa-info-circle"></i>
        <p>Hai effettuato l'accesso con Google. Per modificare la password, utilizza le impostazioni del tuo account Google.</p>
      </div>
      
      <form v-else @submit.prevent="handleSubmit" class="change-password-form">
        <div class="form-group">
          <label for="currentPassword">Password Attuale</label>
          <input
            type="password"
            id="currentPassword"
            v-model="formData.currentPassword"
            required
            placeholder="Inserisci la password attuale"
          />
        </div>
        
        <div class="form-group">
          <label for="newPassword">Nuova Password</label>
          <input
            type="password"
            id="newPassword"
            v-model="formData.newPassword"
            required
            placeholder="Inserisci la nuova password"
          />
          <small class="password-requirements">
            La password deve contenere almeno 8 caratteri, una lettera maiuscola e un carattere speciale <p>(simboli permessi: !@#$%^&*)</p>
          </small>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Conferma Nuova Password</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="formData.confirmPassword"
            required
            placeholder="Conferma la nuova password"
          />
        </div>

        <div class="buttons-container">
          <button type="submit" class="change-password-button">
            Cambia Password
          </button>
          <button type="button" class="back-button" @click="goBack">
            Torna all'Area Personale
          </button>
        </div>
      </form>
      
      <button v-if="isGoogleUser" class="back-button" @click="goBack">
        Torna all'Area Personale
      </button>
      
      <Notification
        :show="showNotification"
        :message="notificationMessage"
        :type="notificationType"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authAPI } from '../services/api';
import Notification from '../components/Notification.vue';

const router = useRouter();
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('success');

const isGoogleUser = computed(() => {
  const authMethod = localStorage.getItem('authMethod');
  const email = localStorage.getItem('userEmail');
  
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

const formData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const handleSubmit = async () => {
  try {
    // Check if user is a Google user
    if (isGoogleUser.value) {
      showError('Non puoi cambiare la password se hai effettuato l\'accesso con Google');
      return;
    }

    if (formData.value.newPassword !== formData.value.confirmPassword) {
      throw new Error('Le password non coincidono');
    }

    console.log('Sending password change request...');
    const response = await authAPI.changePassword({
      currentPassword: formData.value.currentPassword,
      newPassword: formData.value.newPassword
    });
    console.log('Password change response:', response);

    // Reset form
    formData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    showSuccess('Password modificata con successo! Verrai reindirizzato al login.');
    
    // After successful password change, logout and redirect to login
    setTimeout(() => {
      logout();
    }, 2500);
    
  } catch (error) {
    console.error('Password change error:', error);
    showError(error.message || 'Errore durante il cambio password');
  }
};

const showSuccess = (message) => {
  notificationType.value = 'success';
  notificationMessage.value = message;
  showNotification.value = true;
  setTimeout(() => {
    showNotification.value = false;
  }, 2500);
};

const showError = (message) => {
  notificationType.value = 'error';
  notificationMessage.value = message;
  showNotification.value = true;
  setTimeout(() => {
    showNotification.value = false;
  }, 2500);
};

const goBack = () => {
  router.push('/profile');
};

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
</script>

<style scoped>
.change-password-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px);
  background-color: var(--background2-color);
}

.change-password-card {
  background: white;
  padding: 2rem 3rem;
  border-radius: 2.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  text-align: center;
  width: 100%;
  max-width: 600px;
}

.change-password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 2.5rem;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.password-requirements {
  color: #666;
  font-size: 0.875rem;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.change-password-button {
  color: white;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 8rem;
  font-size: 1rem;
  cursor: pointer;
  background-color: var(--primary-color);
  transition: all 0.3s ease-in-out;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
  position: relative;
  overflow: hidden;
}

.change-password-button:hover {
  background-color: var(--background-hover-color);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  animation: pulseGlow 1.5s infinite;
  outline: none;
}

.back-button {
  padding: 0.8rem 2rem;
  border: 1px solid var(--primary-color);
  background-color: transparent;
  color: var(--primary-color);
  border-radius: 8rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.back-button:hover {
  background-color: rgba(76, 175, 80, 0.1);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.2);
}

.google-user-message {
  background-color: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 2.5rem;
  padding: 1rem;
  margin: 2rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.google-user-message i {
  color: #1976d2;
  font-size: 1.5rem;
}

.google-user-message p {
  margin: 0;
  color: #1565c0;
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
</style> 