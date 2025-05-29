<template>
  <div class="profile-container">
    <div class="profile-card">
      <h2>Area Personale</h2>
      <p>Benvenuto, <strong>{{ userEmail }}</strong>!</p>
      <div class="buttons-container">
        <button v-if="isOperator" class="manage-bins-button" @click="goToBinManagement">
          Gestione Cestini
        </button>
        <button class="logout-button" @click="logout">Logout</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { jwtDecode } from 'jwt-decode';

const router = useRouter();
const userEmail = ref(localStorage.getItem('userEmail') || 'utente');

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

// Verifica il token all'avvio del componente
onMounted(() => {
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
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  router.push('/auth');
}

function goToBinManagement() {
  router.push('/bin-management');
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
}
.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}
.logout-button {
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
.manage-bins-button {
  padding: 0.8rem 2rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.manage-bins-button:hover {
  background-color: #1976D2;
}
</style> 