<template>
  <div class="reset-password-container">
    <div class="reset-password-form">
      <h2>Reset Password</h2>
      <p class="description">Inserisci la tua nuova password.</p>

      <div v-if="message" :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-error']">
        {{ message.text }}
      </div>

      <form @submit.prevent="handleSubmit" class="form" v-if="!resetSuccess">
        <div class="form-group">
          <label for="password">Nuova Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Inserisci la nuova password"
            :disabled="loading"
            minlength="8"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Conferma Password</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Conferma la nuova password"
            :disabled="loading"
          />
        </div>

        <button type="submit" :disabled="loading || !isValidForm" class="submit-button">
          {{ loading ? 'Aggiornamento...' : 'Aggiorna Password' }}
        </button>
      </form>

      <div v-if="resetSuccess" class="success-message">
        <router-link to="/auth" class="login-link">
          Vai al Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../services/api';

export default {
  name: 'ResetPassword',
  data() {
    return {
      password: '',
      confirmPassword: '',
      loading: false,
      message: null,
      resetSuccess: false
    };
  },
  computed: {
    token() {
      return this.$route.query.token;
    },
    isValidForm() {
      return this.password.length >= 8 && 
             this.password === this.confirmPassword;
    }
  },
  created() {
    if (!this.token) {
      this.message = {
        type: 'error',
        text: 'Token di reset non valido o mancante.'
      };
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.isValidForm) {
        this.message = {
          type: 'error',
          text: 'Le password non corrispondono o non soddisfano i requisiti minimi.'
        };
        return;
      }

      this.loading = true;
      this.message = null;

      try {
        await authAPI.resetPassword(this.token, this.password);

        this.resetSuccess = true;
        this.message = {
          type: 'success',
          text: 'Password aggiornata con successo!'
        };
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
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.reset-password-form {
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

.success-message {
  text-align: center;
}

.login-link {
  display: inline-block;
  margin-top: 1rem;
  color: #4CAF50;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}
</style> 