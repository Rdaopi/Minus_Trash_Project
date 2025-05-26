<template>
  <div class="profile-container">
    <div class="profile-card">
      <h2>Area Personale</h2>
      <p>Benvenuto, <strong>{{ userEmail }}</strong>!</p>
      
      <ChangePassword @password-changed="handlePasswordChange" />
      
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ChangePassword from '../components/ChangePassword.vue';
import Notification from '../components/Notification.vue';

const router = useRouter();
const userEmail = ref(localStorage.getItem('userEmail') || 'utente');
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('success');

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  router.push('/auth');
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
</style> 