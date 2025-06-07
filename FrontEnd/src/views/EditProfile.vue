<template>
  <div class="edit-profile-page">
    <div class="edit-profile-card">
      <h1>Modifica Profilo</h1>
      <p>Aggiorna le tue informazioni personali</p>
      <div v-if="isGoogleUser" class="google-user-message">
        <i class="fas fa-info-circle"></i>
        <p>Hai effettuato l'accesso con Google. Per modificare il profilo, aggiorna le informazioni dal tuo account Google.</p>
      </div>
      <form v-else @submit.prevent="handleSubmit" class="edit-profile-form">
        <div class="form-group">
          <label for="name">Nome</label>
          <input
            type="text"
            id="name"
            v-model="formData.fullName.name"
            required
            minlength="2"
            maxlength="50"
            placeholder="Inserisci il tuo nome"
          />
        </div>
        <div class="form-group">
          <label for="surname">Cognome</label>
          <input
            type="text"
            id="surname"
            v-model="formData.fullName.surname"
            required
            minlength="2"
            maxlength="50"
            placeholder="Inserisci il tuo cognome"
          />
        </div>
        <div class="form-group">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            v-model="formData.username"
            required
            minlength="3"
            maxlength="30"
            pattern="^[a-zA-Z0-9_]+$"
            placeholder="Inserisci il tuo username"
          />
        </div>
        <div class="buttons-container">
          <button type="submit" class="edit-profile-button">
            Salva Modifiche
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
import { ref, computed, onMounted } from 'vue';
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
  if (!authMethod) {
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
  fullName: {
    name: '',
    surname: ''
  },
  username: ''
});

onMounted(() => {
  // Prefill from localStorage if available
  const name = localStorage.getItem('userName');
  const surname = localStorage.getItem('userSurname');
  const username = localStorage.getItem('userUsername');
  if (name) formData.value.fullName.name = name;
  if (surname) formData.value.fullName.surname = surname;
  if (username) formData.value.username = username;
});

const handleSubmit = async () => {
  try {
    const payload = {
      fullName: {
        name: formData.value.fullName.name,
        surname: formData.value.fullName.surname
      },
      username: formData.value.username
    };
    await authAPI.updateProfile(payload);
    showSuccess('Profilo aggiornato con successo!');
    // Optionally update localStorage
    localStorage.setItem('userName', payload.fullName.name);
    localStorage.setItem('userSurname', payload.fullName.surname);
    localStorage.setItem('userUsername', payload.username);
    // Clear the fields after saving
    formData.value.fullName.name = '';
    formData.value.fullName.surname = '';
    formData.value.username = '';
  } catch (error) {
    showError(error.message || 'Errore durante l\'aggiornamento del profilo');
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
</script>

<style scoped>
.edit-profile-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px);
  background-color: var(--background2-color);
}

.edit-profile-card {
  background: white;
  padding: 2rem 3rem;
  border-radius: 2.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  text-align: center;
  width: 100%;
  max-width: 600px;
}

.edit-profile-form {
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

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.edit-profile-button {
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

.edit-profile-button:hover {
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