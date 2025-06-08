<template>
  <div class="account-management">
    <div v-if="isAdmin" class="container">
      <div class="header">
        <h1>Gestione Account</h1>
        <div class="header-buttons">
          <button class="send-message-btn" @click="showMessageModal = true">
            <i class="fas fa-envelope"></i> Invia Messaggio
          </button>
          <button class="add-user-btn" @click="showAddUserModal = true">
            <i class="fas fa-plus"></i> Nuovo Account
          </button>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="alert success">
        <i class="fas fa-check-circle"></i>
        {{ successMessage }}
        <button class="close-btn" @click="successMessage = ''">×</button>
      </div>
      <div v-if="errorMessage" class="alert error">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
        <button class="close-btn" @click="errorMessage = ''">×</button>
      </div>

      <!-- Users Table -->
      <div class="table-container">
        <table v-if="users.length > 0">
          <thead>
            <tr>
              <th>Email</th>
              <th>Ruolo</th>
              <th>Data Registrazione</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user._id">
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.role">
                  {{ translateRole(user.role) }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <span class="status-badge" :class="{ active: user.isActive }">
                  {{ user.isActive ? 'Attivo' : 'Inattivo' }}
                </span>
              </td>
              <td class="actions">
                <button 
                  class="edit-btn" 
                  @click="editUser(user)"
                  :disabled="isCurrentUser(user)"
                  :title="isCurrentUser(user) ? 'Non puoi modificare il tuo account' : ''"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  class="delete-btn" 
                  @click="confirmDelete(user)" 
                  :disabled="user.role === 'amministratore' || isCurrentUser(user)"
                  :title="isCurrentUser(user) ? 'Non puoi eliminare il tuo account' : ''"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-data">
          <i class="fas fa-users"></i>
          <p>Nessun utente trovato</p>
        </div>
      </div>

      <!-- Add/Edit User Modal -->
      <div v-if="showAddUserModal || showEditUserModal" class="modal">
        <div class="modal-content">
          <h2>{{ showEditUserModal ? 'Modifica Account' : 'Nuovo Account' }}</h2>
          <form @submit.prevent="handleSubmit">
            <!-- Show these fields only when creating a new account -->
            <template v-if="!showEditUserModal">
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  v-model="userForm.email"
                  required
                >
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <input
                  type="password"
                  id="password"
                  v-model="userForm.password"
                  required
                >
              </div>
              <div class="form-group">
                <label for="username">Username</label>
                <input
                  type="text"
                  id="username"
                  v-model="userForm.username"
                  required
                >
              </div>
              <div class="form-group">
                <label for="name">Nome</label>
                <input
                  type="text"
                  id="name"
                  v-model="userForm.fullName.name"
                  required
                >
              </div>
              <div class="form-group">
                <label for="surname">Cognome</label>
                <input
                  type="text"
                  id="surname"
                  v-model="userForm.fullName.surname"
                  required
                >
              </div>
            </template>
            
            <!-- Always show role and status -->
            <div class="form-group">
              <label for="role">Ruolo</label>
              <select id="role" v-model="userForm.role" required>
                <option value="cittadino">Cittadino</option>
                <option value="operatore_comunale">Operatore Comunale</option>
                <option value="amministratore">Amministratore</option>
              </select>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="userForm.isActive">
                Account Attivo
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" class="cancel-btn" @click="closeModal">Annulla</button>
              <button type="submit" class="submit-btn">
                {{ showEditUserModal ? 'Salva Modifiche' : 'Crea Account' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal">
        <div class="modal-content">
          <h2>Conferma Eliminazione</h2>
          <p>Sei sicuro di voler eliminare l'account di <strong>{{ userToDelete?.email }}</strong>?</p>
          <div class="modal-actions">
            <button class="cancel-btn" @click="showDeleteModal = false">Annulla</button>
            <button class="delete-btn" @click="deleteUser">Elimina</button>
          </div>
        </div>
      </div>

      <!-- Send Message Modal -->
      <div v-if="showMessageModal" class="modal">
        <div class="modal-content message-modal">
          <h2>Invia Messaggio</h2>
          <form @submit.prevent="handleMessageSubmit">
            <div class="form-group">
              <label for="message">Messaggio</label>
              <textarea
                id="message"
                v-model="messageForm.content"
                required
                rows="4"
                placeholder="Scrivi il tuo messaggio..."
                class="message-textarea"
              ></textarea>
            </div>
            
            <div class="users-list">
              <h3>Seleziona i destinatari</h3>
              <div class="select-all">
                <label>
                  <input
                    type="checkbox"
                    v-model="messageForm.selectAll"
                    @change="toggleAllUsers"
                  >
                  Seleziona tutti
                </label>
              </div>
              <div class="users-scroll">
                <div v-for="user in users" :key="user._id" class="user-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      v-model="messageForm.selectedUsers"
                      :value="user._id"
                    >
                    {{ user.email }} ({{ translateRole(user.role) }})
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="cancel-btn" @click="closeMessageModal">Annulla</button>
              <button type="submit" class="submit-btn" :disabled="!messageForm.selectedUsers.length">
                Invia Messaggio
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div v-else class="unauthorized">
      <i class="fas fa-lock"></i>
      <h2>Accesso non autorizzato</h2>
      <p>Solo gli amministratori possono accedere a questa sezione.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { jwtDecode } from 'jwt-decode';
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const router = useRouter();
const users = ref([]);
const showAddUserModal = ref(false);
const showEditUserModal = ref(false);
const showDeleteModal = ref(false);
const showMessageModal = ref(false);
const userToDelete = ref(null);
const successMessage = ref('');
const errorMessage = ref('');

const userForm = ref({
  email: '',
  password: '',
  username: '',
  role: 'cittadino',
  isActive: true,
  fullName: {
    name: '',
    surname: ''
  }
});

const messageForm = ref({
  content: '',
  selectAll: false,
  selectedUsers: []
});

// Check if user is admin
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

// Load users on component mount
onMounted(async () => {
  if (!isAdmin.value) {
    router.push('/profile');
    return;
  }
  await loadUsers();
});

// Load users from API
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load users');
    
    const data = await response.json();
    users.value = data;
  } catch (error) {
    console.error('Error loading users:', error);
    errorMessage.value = 'Errore nel caricamento degli utenti';
  }
}

// Handle form submission
async function handleSubmit() {
  try {
    const url = showEditUserModal.value 
      ? `${API_BASE_URL}/users/${userForm.value._id}`
      : `${API_BASE_URL}/users`;
    
    const method = showEditUserModal.value ? 'PUT' : 'POST';
    
    // When editing, only send role and isActive status
    const payload = showEditUserModal.value 
      ? {
          role: userForm.value.role,
          isActive: userForm.value.isActive
        }
      : userForm.value;

    // Check if trying to modify own account
    if (showEditUserModal.value && userForm.value._id === getCurrentUserId.value) {
      throw new Error('Non puoi modificare il tuo account');
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save user');
    }

    const updatedUser = await response.json();

    // If we're editing and the role was changed, force the user to log out
    if (showEditUserModal.value) {
      // Get the original user from the users list
      const originalUser = users.value.find(u => u._id === userForm.value._id);
      if (originalUser && originalUser.role !== updatedUser.role) {
        // Create a message to show to the user
        const userEmail = updatedUser.email;
        successMessage.value = `Il ruolo dell'utente ${userEmail} è stato aggiornato a ${translateRole(updatedUser.role)}. L'utente dovrà effettuare nuovamente il login per applicare le modifiche.`;
      }
    }

    await loadUsers();
    closeModal();
    if (!successMessage.value) {
      successMessage.value = showEditUserModal.value 
        ? 'Account modificato con successo'
        : 'Nuovo account creato con successo';
    }
  } catch (error) {
    console.error('Error saving user:', error);
    errorMessage.value = error.message || 'Errore nel salvataggio dell\'account';
  }
}

// Delete user
async function deleteUser() {
  if (!userToDelete.value) return;

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userToDelete.value._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to delete user');

    await loadUsers();
    showDeleteModal.value = false;
    userToDelete.value = null;
    successMessage.value = 'Account eliminato con successo';
  } catch (error) {
    console.error('Error deleting user:', error);
    errorMessage.value = 'Errore nell\'eliminazione dell\'account';
  }
}

// Edit user
function editUser(user) {
  if (isCurrentUser(user)) {
    errorMessage.value = 'Non puoi modificare il tuo account';
    return;
  }
  
  userForm.value = {
    _id: user._id,
    role: user.role,
    isActive: user.isActive || true
  };
  showEditUserModal.value = true;
}

// Confirm delete
function confirmDelete(user) {
  userToDelete.value = user;
  showDeleteModal.value = true;
}

// Close modal and reset form
function closeModal() {
  showAddUserModal.value = false;
  showEditUserModal.value = false;
  userForm.value = {
    email: '',
    password: '',
    username: '',
    role: 'cittadino',
    isActive: true,
    fullName: {
      name: '',
      surname: ''
    }
  };
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Translate role for display
function translateRole(role) {
  const translations = {
    cittadino: 'Cittadino',
    operatore_comunale: 'Operatore Comunale',
    amministratore: 'Amministratore'
  };
  return translations[role] || role;
}

// Add getCurrentUserId computed property
const getCurrentUserId = computed(() => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.id;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
});

// Add isCurrentUser function
function isCurrentUser(user) {
  return user._id === getCurrentUserId.value;
}

// Handle message submission
async function handleMessageSubmit() {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        content: messageForm.value.content,
        recipients: messageForm.value.selectedUsers
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    successMessage.value = 'Messaggio inviato con successo';
    closeMessageModal();
  } catch (error) {
    console.error('Error sending message:', error);
    errorMessage.value = error.message || 'Errore nell\'invio del messaggio';
  }
}

// Close message modal
function closeMessageModal() {
  showMessageModal.value = false;
  messageForm.value = {
    content: '',
    selectAll: false,
    selectedUsers: []
  };
}

// Toggle all users
function toggleAllUsers() {
  if (messageForm.value.selectAll) {
    messageForm.value.selectedUsers = users.value.map(user => user._id);
  } else {
    messageForm.value.selectedUsers = [];
  }
}
</script>

<style scoped>
.account-management {
  padding: 2rem;
  min-height: calc(100vh - 64px);
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.send-message-btn, .add-user-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.send-message-btn:hover, .add-user-btn:hover {
  background-color: #45a049;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.role-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  white-space: nowrap;
  display: inline-block;
}

.role-badge.cittadino {
  background-color: #e3f2fd;
  color: #1976d2;
}

.role-badge.operatore_comunale {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.role-badge.amministratore {
  background-color: #fbe9e7;
  color: #d84315;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  background-color: #ffebee;
  color: #c62828;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background-color: #d32f2f;
}

.delete-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 2rem;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  margin: auto;
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

input, select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: #fff;
}

input:focus, select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.submit-btn, .cancel-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
}

.submit-btn:hover {
  background-color: #45a049;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.error {
  background-color: #ffebee;
  color: #c62828;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2rem;
}

.no-data {
  padding: 3rem;
  text-align: center;
  color: #666;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.unauthorized {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #666;
}

.unauthorized i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #f44336;
}

@media (max-width: 768px) {
  .account-management {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .table-container {
    overflow-x: auto;
  }

  .modal {
    padding: 1rem;
  }

  .modal-content {
    padding: 1.5rem;
    max-height: 85vh;
  }

  .modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .modal-actions button {
    width: 100%;
  }
}

@media (max-height: 600px) {
  .modal-content {
    max-height: 95vh;
  }
}

.edit-btn:disabled, .delete-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.edit-btn:disabled:hover, .delete-btn:disabled:hover {
  background-color: #ccc;
}

[title] {
  position: relative;
}

[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}

.message-modal {
  max-width: 800px;
}

.message-textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: #fff;
  margin-bottom: 1rem;
}

.users-list {
  margin-bottom: 1rem;
}

.select-all {
  margin-bottom: 0.5rem;
}

.users-scroll {
  max-height: 200px;
  overflow-y: auto;
}

.user-checkbox {
  margin-bottom: 0.5rem;
}

.user-checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-checkbox input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
}
</style> 