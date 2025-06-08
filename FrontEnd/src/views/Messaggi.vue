<template>
  <div class="messaggi">
    <div class="messaggi-header">
      <h1>I Miei Messaggi</h1>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Caricamento messaggi...</p>
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      {{ error }}
      <button class="close-btn" @click="error = ''">×</button>
    </div>

    <!-- Messages list -->
    <div v-if="!loading && messages.length > 0" class="messages-list">
      <div v-for="message in sortedMessages" 
           :key="message._id" 
           class="message-card"
           :class="{ 'unread': !isMessageRead(message) }"
           @click="markAsRead(message)">
        <div class="message-header">
          <div class="sender-info">
            <i class="fas fa-user"></i>
            <span>{{ message.sender.email }}</span>
          </div>
          <div class="message-date">
            {{ formatDate(message.createdAt) }}
          </div>
        </div>
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && messages.length === 0" class="empty-state">
      <i class="fas fa-inbox"></i>
      <p>Non hai messaggi</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const loading = ref(true);
const error = ref('');
const messages = ref([]);

// Sort messages by date, newest first
const sortedMessages = computed(() => {
  return [...messages.value].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
});

// Check if message is read by current user
const isMessageRead = (message) => {
  const userId = getCurrentUserId();
  return message.readBy && message.readBy.includes(userId);
};

// Get current user ID from token
const getCurrentUserId = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload).id;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Mark message as read
const markAsRead = async (message) => {
  if (isMessageRead(message)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/messages/${message._id}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark message as read');
    }

    // Update local message state
    const userId = getCurrentUserId();
    if (!message.readBy) message.readBy = [];
    message.readBy.push(userId);
  } catch (err) {
    console.error('Error marking message as read:', err);
  }
};

// Load messages on component mount
onMounted(async () => {
  await loadMessages();
});

// Load messages from API
async function loadMessages() {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load messages');
    }

    const data = await response.json();
    messages.value = data;
  } catch (err) {
    console.error('Error loading messages:', err);
    error.value = 'Errore nel caricamento dei messaggi';
  } finally {
    loading.value = false;
  }
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.messaggi {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.messaggi-header {
  margin-bottom: 2rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.message-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.message-card.unread {
  background-color: #f0f7ff;
  border-left: 4px solid #2196F3;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.message-date {
  font-size: 0.9rem;
  color: #666;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ccc;
}

@media (max-width: 768px) {
  .messaggi {
    padding: 1rem;
  }
}
</style> 