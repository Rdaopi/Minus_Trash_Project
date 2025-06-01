<template>
  <div class="forgot-password-container">
    <div class="forgot-password-form">
      <h2>Recupera Password</h2>
      <p class="description">Inserisci la tua email per ricevere il link di reset della password.</p>
      
      <div v-if="message" :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-error']">
        {{ message.text }}
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Inserisci la tua email"
            :disabled="loading"
          />
        </div>

        <button type="submit" :disabled="loading" class="submit-button">
          {{ loading ? 'Invio in corso...' : 'Invia Link di Reset' }}
        </button>

        <div class="links">
          <router-link to="/auth" class="back-link">
            Torna al Login
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../services/api';

export default {
  name: 'ForgotPassword',
  data() {
    return {
      email: '',
      loading: false,
      message: null
    };
  },
  methods: {
    async handleSubmit() {
      this.loading = true;
      this.message = null;

      try {
        await authAPI.requestPasswordReset(this.email);

        this.message = {
          type: 'success',
          text: 'Se l\'email è registrata, riceverai un link per reimpostare la password.(controlla anche la casella di spam)'
        };
        this.email = '';
      } catch (error) {
        this.message = {
          type: 'error',
          text: error.message || 'Si è verificato un errore. Riprova più tardi.'
        };
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.forgot-password-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 1rem;
}

.description {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #4CAF50;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background-color: #45a049;
}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.links {
  text-align: center;
  margin-top: 1rem;
}

.back-link {
  color: #4CAF50;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}
</style> 