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
                    <router-link v-if="isLogin" to="/forgot-password" class="forgot-password-link">
                        Password dimenticata?
                    </router-link>
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
import { jwtDecode } from 'jwt-decode';

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
            // Check for parameters in the query string (history mode)
            const urlParams = new URLSearchParams(window.location.search);
            
            // Check for parameters in the hash (hash mode)
            const hashParams = window.location.hash 
                ? new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?'))) 
                : new URLSearchParams('');
            
            // Get token, role and error from either source
            const token = urlParams.get('token') || hashParams.get('token');
            const role = urlParams.get('role') || hashParams.get('role');
            const error = urlParams.get('error') || hashParams.get('error');

            if (error) {
                showError(decodeURIComponent(error));
                return;
            }

            if (token) {
                try {
                      // Set auth method first
                      localStorage.setItem('authMethod', 'google');

                      // Store the token
                      localStorage.setItem('token', token);

                      // Get refresh token from URL if available
                      const refreshToken = new URLSearchParams(window.location.search).get('refreshToken');
                      if (refreshToken) {
                          localStorage.setItem('refreshToken', refreshToken);
                      }

                      // Decode the token to get user info
                      let decoded;
                      try {
                          decoded = jwtDecode(token); // assuming jwt-decode is available
                          console.log('Decoded token:', decoded);
                      } catch (e) {
                          console.error('Failed to decode token:', e);
                          throw new Error('Token decoding failed');
                      }

                      // Store email
                      if (decoded.email) {
                          localStorage.setItem('userEmail', decoded.email);
                      }

                      // First try to get role from URL parameter, then from token
                      const userRole = role || decoded.role;
                      if (userRole) {
                          localStorage.setItem('userRole', userRole);
                          console.log('Stored role:', userRole);
                      } else {
                          console.warn('No role found in token or URL parameters');
                          throw new Error('Ruolo utente non trovato');
                      }


                    showSuccessNotification('Login effettuato con successo!');
                    emit('login-success');
                    
                    // Clean up the URL - handle both hash and history modes
                    if (window.location.hash && window.location.hash.includes('?')) {
                        window.history.replaceState({}, document.title, window.location.hash.split('?')[0]);
                    } else {
                        window.history.replaceState({}, document.title, '/auth');
                    }
                    
                    // Redirect to home
                    setTimeout(() => {
                        router.push('/');
                    }, 1000);
                } catch (err) {
                    console.error('Error during login:', err);
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
                    try {
                        response = await authAPI.login(formData.value.email, formData.value.password);
                        if (response && response.accessToken && response.refreshToken) {
                            localStorage.setItem('userEmail', formData.value.email);
                            localStorage.setItem('token', response.accessToken);
                            localStorage.setItem('refreshToken', response.refreshToken);
                            localStorage.setItem('authMethod', 'regular');
                            
                            // Store role if available in the response
                            if (response.user && response.user.role) {
                                localStorage.setItem('userRole', response.user.role);
                                console.log('Stored role from response:', response.user.role);
                            } else {
                                // If role is not in response, try to decode from token
                                try {
                                    const decoded = jwtDecode(response.accessToken);
                                    if (decoded && decoded.role) {
                                        localStorage.setItem('userRole', decoded.role);
                                        console.log('Stored role from token:', decoded.role);
                                    } else {
                                        console.warn('No role found in token or response');
                                        throw new Error('Ruolo utente non trovato');
                                    }
                                } catch (error) {
                                    console.error('Error handling user role:', error);
                                    throw new Error('Errore nella gestione del ruolo utente');
                                }
                            }
                            
                            emit('login-success');
                            showSuccessNotification('Login effettuato con successo!');
                            // Wait for the notification to be visible before redirecting
                            setTimeout(() => {
                                router.push('/');
                            }, 1000);
                        } else {
                            throw new Error('Token non ricevuto dal server');
                        }
                    } catch (loginError) {
                        error.value = loginError.message || 'Credenziali non valide. Riprova.';
                        notificationMessage.value = error.value;
                        notificationType.value = 'error';
                        showNotification.value = true;
                        setTimeout(() => {
                            showNotification.value = false;
                        }, 3000);
                        return; // Stop execution here for login errors
                    }
                    
                } else {
                    // Registration flow
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
                    
                    // Clear form and switch to login
                    formData.value = {
                        email: '',
                        password: '',
                        username: '',
                        name: '',
                        surname: ''
                    };
                    setTimeout(() => isLogin.value = true, 1000);
                }
            } catch (err) {
                const errorMessage = err.message || 'Si è verificato un errore. Riprova più tardi.';
                error.value = errorMessage;
                notificationMessage.value = errorMessage;
                notificationType.value = 'error';
                showNotification.value = true;
                setTimeout(() => showNotification.value = false, 3000);
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

.forgot-password-link {
    display: block;
    text-align: right;
    margin-top: 0.5rem;
    color: #4CAF50;
    text-decoration: none;
    font-size: 0.9rem;
}

.forgot-password-link:hover {
    text-decoration: underline;
}
</style>