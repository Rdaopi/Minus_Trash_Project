<template>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <i class="fas fa-leaf auth-icon"></i>
                <h2>Accedi a MinusTrash</h2>
                <p>Unisciti alla comunità eco-friendly</p>
            </div>
            <div v-if="error" class="error-message">
                <i class="fas fa-exclamation-circle"></i> {{ error }}
            </div>
            <form @submit.prevent="handleSubmit" class="auth-form">
                <div class="form-group">
                    <label for="email">
                        <i class="fas fa-envelope"></i> Email
                    </label>
                    <input 
                        type="email" 
                        id="email" 
                        v-model="email" 
                        required
                        placeholder="La tua email"
                        :disabled="loading"
                    >
                </div>
                <div class="form-group">
                    <label for="password">
                        <i class="fas fa-lock"></i> Password
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        v-model="password" 
                        required
                        placeholder="La tua password"
                        :disabled="loading"
                    >
                </div>
                <button type="submit" class="submit-btn" :disabled="loading">
                    <i class="fas fa-spinner fa-spin" v-if="loading"></i>
                    <i class="fas fa-sign-in-alt" v-else></i>
                    {{ loading ? 'Accesso in corso...' : 'Accedi' }}
                </button>
                <div class="auth-links">
                    <a href="#" @click.prevent="toggleMode" class="register">
                        {{ isLogin ? 'Registrati' : 'Hai già un account? Accedi' }}
                    </a>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
import { authAPI } from '../services/api';

export default {
    name: 'Auth',
    data() {
        return {
            email: '',
            password: '',
            loading: false,
            error: null,
            isLogin: true // true = login mode, false = registration mode
        }
    },
    methods: {
        // Gestisce il submit del form (login o registrazione)
        async handleSubmit() {
            this.error = null;
            this.loading = true;

            try {
                if (this.isLogin) {
                    // Provo a fare il login
                    const response = await authAPI.login(this.email, this.password);
                    // Se arrivo qui, il login è andato a buon fine
                    console.log('Login effettuato!');
                    this.$router.push('/map'); // Redirect alla mappa dopo il login
                } else {
                    // Provo a fare la registrazione
                    // TODO: aggiungere validazione più robusta
                    await authAPI.register({ email: this.email, password: this.password });
                    // Cambio in modalità login dopo registrazione riuscita
                    this.isLogin = true;
                    this.error = 'Registrazione completata! Ora puoi accedere.';
                }
            } catch (error) {
                // Gestisco errori di login/registrazione
                // Per ora mostro solo il messaggio, ma potrei fare cose più specifiche
                this.error = error.message || 'Si è verificato un errore. Riprova più tardi.';
            } finally {
                // Indipendentemente dal risultato, tolgo lo stato di caricamento
                this.loading = false;
            }
        },
        // Alterna tra modalità login e registrazione
        toggleMode() {
            this.isLogin = !this.isLogin;
            this.error = null; // Pulisco eventuali errori precedenti
        }
    }
}
</script>

<style scoped>
/* Contenitore principale centrato verticalmente */
.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 2rem;
}

/* Card con ombra e bordi arrotondati */
.auth-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    padding: 2rem;
}

/* Intestazione con icona e titolo */
.auth-header {
    text-align: center;
    margin-bottom: 2rem;
}

/* Icona grande e verde */
.auth-icon {
    font-size: 3rem;
    color: var(--primary-color);
    margin-bottom: 1rem;
}

.auth-header h2 {
    color: var(--text-color);
    margin-bottom: 0.5rem;
}

.auth-header p {
    color: #666;
    font-size: 0.9rem;
}

/* Form con spaziatura tra gli elementi */
.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Gruppo di form (label + input) */
.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    color: var(--text-color);
    font-weight: 500;
}

/* Stile degli input */
.form-group input {
    padding: 0.8rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.form-group input:focus {
    border-color: var(--primary-color);
    outline: none;
}

/* Pulsante submit grande e ben visibile */
.submit-btn {
    background-color: var(--primary-color);
    color: white;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.3s ease;
}

.submit-btn:hover {
    background-color: var(--secondary-color);
    transform: translateY(-2px);
}

/* Link aggiuntivi sotto al form */
.auth-links {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    font-size: 0.9rem;
}

.auth-links a {
    color: var(--primary-color);
    text-decoration: none;
    transition: color 0.3s ease;
}

.auth-links a:hover {
    color: var(--secondary-color);
}

/* Adattamento per schermi molto piccoli */
@media (max-width: 480px) {
    .auth-card {
        padding: 1.5rem;
    }

    .auth-header h2 {
        font-size: 1.5rem;
    }
}

/* Messaggio di errore in rosso */
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

/* Stili per elementi disabilitati durante il caricamento */
.submit-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
}

input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
}
</style>