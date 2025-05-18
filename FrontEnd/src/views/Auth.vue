<template>
    <div class="auth-container">
        <Notification 
            :show="showNotification"
            :message="notificationMessage"
            :type="notificationType"
        />
        <div class="auth-card">
            <div class="auth-header">
                <i class="fas fa-leaf auth-icon"></i>
                <h2>{{ isLogin ? 'Accedi a MinusTrash' : 'Registrati su MinusTrash' }}</h2>
                <p>{{ isLogin ? 'Accedi al tuo account' : 'Unisciti alla comunità eco-friendly' }}</p>
            </div>
            <div v-if="error" class="error-message">
                <i class="fas fa-exclamation-circle"></i> {{ error }}
            </div>
            <form @submit.prevent="handleSubmit" class="auth-form">
                <!-- Registration-only fields -->
                <template v-if="!isLogin">
                    <div class="form-group">
                        <label for="name">Nome</label>
                        <input
                            type="text"
                            id="name"
                            v-model="formData.name"
                            required
                            placeholder="Inserisci il tuo nome"
                        />
                    </div>
                    <div class="form-group">
                        <label for="surname">Cognome</label>
                        <input
                            type="text"
                            id="surname"
                            v-model="formData.surname"
                            required
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
                            placeholder="Scegli uno username"
                        />
                    </div>
                </template>
                <!-- Common fields -->
                <div class="form-group">
                    <label for="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        v-model="formData.email"
                        required
                        placeholder="Inserisci la tua email"
                    />
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        v-model="formData.password"
                        required
                        placeholder="Inserisci la password"
                    />
                    <small v-if="!isLogin" class="password-requirements">
                        La password deve contenere almeno 8 caratteri, una lettera maiuscola e un carattere speciale
                    </small>
                </div>
                <button type="submit" class="auth-button">
                    {{ isLogin ? 'Accedi' : 'Registrati' }}
                </button>
            </form>
            
            <div class="auth-divider">
                <span>oppure</span>
            </div>
            
            <GoogleSignIn />
            
            <div class="auth-footer">
                <p>
                    {{ isLogin ? 'Non hai un account?' : 'Hai già un account?' }}
                    <a href="#" @click.prevent="toggleAuthMode">
                        {{ isLogin ? 'Registrati' : 'Accedi' }}
                    </a>
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { authAPI } from '../services/api';
import { useRouter } from 'vue-router';
import Notification from '../components/Notification.vue';
import GoogleSignIn from '../components/GoogleSignIn.vue';

export default {
    name: 'Auth',
    components: {
        Notification,
        GoogleSignIn
    },
    emits: ['login-success'],
    setup(props, { emit }) {
        const router = useRouter();
        const isLogin = ref(true);
        const error = ref('');
        const showNotification = ref(false);
        const notificationMessage = ref('');
        const notificationType = ref('success');
        const formData = ref({
            email: '',
            password: '',
            username: '',
            name: '',
            surname: ''
        });

        // Handle OAuth callback
        const handleOAuthCallback = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            const error = urlParams.get('error');

            if (error) {
                showError(decodeURIComponent(error));
                return;
            }

            if (token) {
                try {
                    // Store the token
                    localStorage.setItem('token', token);
                    
                    // Decode the token to get user info
                    const tokenParts = token.split('.');
                    const payload = JSON.parse(atob(tokenParts[1]));
                    
                    // Store email like in regular login
                    if (payload.email) {
                        localStorage.setItem('userEmail', payload.email);
                    }

                    showSuccessNotification('Login effettuato con successo!');
                    emit('login-success');
                    
                    // Clean up the URL
                    window.history.replaceState({}, document.title, '/auth');
                    
                    // Redirect to home
                    setTimeout(() => {
                        router.push('/');
                    }, 1000);
                } catch (err) {
                    showError('Errore durante il login. Riprova più tardi.');
                }
            }
        };

        // Call handleOAuthCallback when component mounts
        onMounted(() => {
            handleOAuthCallback();
        });

        const showError = (message) => {
            error.value = message;
            notificationMessage.value = message;
            notificationType.value = 'error';
            showNotification.value = true;
            setTimeout(() => {
                showNotification.value = false;
            }, 3000);
        };

        const toggleAuthMode = () => {
            isLogin.value = !isLogin.value;
            error.value = '';
            formData.value = {
                email: '',
                password: '',
                username: '',
                name: '',
                surname: ''
            };
        };

        const showSuccessNotification = (message) => {
            notificationMessage.value = message;
            notificationType.value = 'success';
            showNotification.value = true;
            setTimeout(() => {
                showNotification.value = false;
            }, 3000);
        };

        const handleSubmit = async () => {
            try {
                error.value = '';
                let response;
                if (isLogin.value) {
                    // Login flow
                    response = await authAPI.login(formData.value.email, formData.value.password);
                    if (response && response.token) {
                        localStorage.setItem('userEmail', formData.value.email);
                        localStorage.setItem('token', response.token);
                        emit('login-success');
                        showSuccessNotification('Login effettuato con successo!');
                        // Wait for the notification to be visible before redirecting
                        setTimeout(() => {
                            router.push('/');
                        }, 1000);
                    } else {
                        throw new Error('Token non ricevuto dal server');
                    }
                } else {
                    // Registration flow - no token handling here
                    const registrationData = {
                        email: formData.value.email,
                        password: formData.value.password,
                        username: formData.value.username,
                        fullName: {
                            name: formData.value.name,
                            surname: formData.value.surname
                        }
                    };
                    await authAPI.register(registrationData);
                    showSuccessNotification('Registrazione completata con successo! Effettua il login per continuare.');
                    
                    // Clear form data
                    formData.value = {
                        email: '',
                        password: '',
                        username: '',
                        name: '',
                        surname: ''
                    };
                    
                    // Switch to login mode after registration
                    setTimeout(() => {
                        isLogin.value = true;
                    }, 1000);
                }
            } catch (err) {
                error.value = err.message || 'Si è verificato un errore. Riprova più tardi.';
                notificationMessage.value = error.value;
                notificationType.value = 'error';
                showNotification.value = true;
                setTimeout(() => {
                    showNotification.value = false;
                }, 3000);
            }
        };

        return {
            isLogin,
            formData,
            error,
            handleSubmit,
            toggleAuthMode,
            showNotification,
            notificationMessage,
            notificationType
        };
    }
};
</script>

<style scoped>
.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 64px);
    padding: 2rem;
    background-color: var(--background2-color);
    border-radius: 2.5rem;
}

.auth-card {
    background-color: var(--background2-color);
    padding: 2rem;
    border-radius: 2.5rem;
    border: 2px solid var(--primary-color);
    box-shadow: 0 5px 20px rgba(0, 212, 255, 0.15);
    width: 100%;
    max-width: 400px;
}

.auth-header {
    text-align: center;
    margin-bottom: 2rem;
    border-radius: 2.5rem;
}

.auth-icon {
    font-size: 2rem;
    color: #4CAF50;
    margin-bottom: 1rem;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    border-radius: 2.5rem;
    background-color: var(--background2-color);
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
    border-color: #4CAF50;
    border-radius: 2.5rem;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.password-requirements {
    color: #666;
    font-size: 0.875rem;
}

.auth-button {
    background-color: var(--primary-color);
    color: #fff;
    padding: 0.75rem;
    border: none;
    border-radius: 8rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
    position: relative;
    overflow: hidden;
}

.auth-button:hover, .auth-button:focus {
    background-color: var(--background-hover-color);
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
    animation: pulseGlow 1.5s infinite;
    outline: none;
}

.auth-button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
}

@keyframes pulseGlow {
    0% {
        box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
    }
    50% {
        box-shadow: 0 5px 25px rgba(76, 175, 80, 0.7);
    }
    100% {
        box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
    }
}

.auth-footer {
    margin-top: 1.5rem;
    text-align: center;
}

.auth-footer a {
    color: #4CAF50;
    text-decoration: none;
    font-weight: 500;
}

.auth-footer a:hover {
    text-decoration: underline;
}

.error-message {
    background-color: #ffebee;
    color: #c62828;
    padding: 0.75rem;
    border-radius: 2.5rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.auth-divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 20px 0;
}

.auth-divider::before,
.auth-divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #ddd;
}

.auth-divider span {
    padding: 0 10px;
    color: #666;
    font-size: 14px;
}
</style>