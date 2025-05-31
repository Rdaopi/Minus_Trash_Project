<template>
  <div class="change-password-container">
    <h3>Cambia Password</h3>
    <form @submit.prevent="handleSubmit" class="change-password-form">
      <div class="form-group">
        <label for="currentPassword">Password Attuale</label>
        <input
          type="password"
          id="currentPassword"
          v-model="formData.currentPassword"
          required
          placeholder="Inserisci la password attuale"
          :disabled="isGoogleUser"
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
          :disabled="isGoogleUser"
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
          :disabled="isGoogleUser"
        />
      </div>

      <button type="submit" class="change-password-button" :disabled="isGoogleUser">
        Cambia Password
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { authAPI } from '../services/api';
import Notification from './Notification.vue';

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

const emit = defineEmits(['password-changed']);

const handleSubmit = async () => {
  try {
    // Check if user is a Google user
    if (isGoogleUser.value) {
      emit('password-changed', {
        type: 'error',
        message: 'Non puoi cambiare la password se hai effettuato l\'accesso con Google'
      });
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

    emit('password-changed', {
      type: 'success',
      message: 'Password modificata con successo'
    });
  } catch (error) {
    console.error('Password change error:', error);
    emit('password-changed', {
      type: 'error',
      message: error.message || 'Errore durante il cambio password'
    });
  }
};
</script>

<style scoped>
.change-password-container {
  background: white;
  padding: 2rem;
  border-radius: 2.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin-top: 2rem;
}

.change-password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
.change-password-button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
}

.change-password-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    animation: none;
}

.form-group input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
    border-color: #ddd;
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