//const API_BASE_URL = '/api';
// Get the API base URL from environment variable or fallback to relative path
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

// Funzioni helper
const handleResponse = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    let data;
    
    // Only try to parse as JSON if the content type is application/json
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        console.error('JSON parsing error:', e);
        throw new Error('Errore nella risposta dal server: JSON incompleto o non valido');
      }
    } else {
      // Handle non-JSON responses
      data = { message: await response.text() };
    }
    
    if (!response.ok) {
      console.error('API error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.error || `Errore ${response.status}: ${response.statusText}`);
    }
    return data;
  } catch (error) {
    console.error('Response handling error:', error);
    throw error;
  }
};

// Prelevo i token per le richieste autenticate
const getAuthHeaders = async () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!token && !refreshToken) {
    throw new Error('No authentication tokens available');
  }

  // Check if token is expired
  if (token) {
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const timeLeft = expirationTime - currentTime;
      
      if (timeLeft > 0) {
        console.log(`%cAccess Token valid for ${Math.round(timeLeft/1000)}s`, 'background: #4caf50; color: white; padding: 2px 5px; border-radius: 3px');
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
      } else {
        console.log('%cAccess Token Expired - Attempting Refresh', 'background: #ff9800; color: white; padding: 2px 5px; border-radius: 3px');
      }
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }

  // Token is expired or invalid, try to refresh
  if (refreshToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      const newTokens = await handleResponse(response);
      localStorage.setItem('token', newTokens.accessToken);
      localStorage.setItem('refreshToken', newTokens.refreshToken);
      console.log('%cToken Successfully Refreshed', 'background: #4caf50; color: white; padding: 2px 5px; border-radius: 3px');
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newTokens.accessToken}`
      };
    } catch (error) {
      console.log('%cToken Refresh Failed - Redirecting to Login', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth';
      throw new Error('Session expired. Please login again.');
    }
  }

  throw new Error('No valid authentication tokens available');
};

// Header base per tutte le chiamate
const getBaseHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});

// Per il debug delle chiamate API
const logApiCall = (method, url, body = null) => {
  console.log(`API ${method}:`, url);
  if (body) console.log('Request Body:', body);
};

// API per l'autenticazione
export const authAPI = {
  // Login con email e password
  async login(email, password) {
    const url = `${API_BASE_URL}/auth/login`;
    logApiCall('POST', url);
    try {
      // Create base64 encoded credentials for Basic Auth
      const credentials = btoa(`${email}:${password}`);
      
      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await handleResponse(response);
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('La richiesta di login è scaduta. Verifica la tua connessione Internet.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Registrazione nuovo utente
  async register(userData) {
    const url = `${API_BASE_URL}/auth/register`;
    logApiCall('POST', url, userData);
    try {
      console.log('Sending registration data:', userData);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      console.log('Registration response status:', response.status);
      const data = await handleResponse(response);
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout (rimuove il token)
  async logout(refreshToken) {
      const url = `${API_BASE_URL}/auth/logout`;
      logApiCall('POST', url);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ refreshToken })
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },

  // Change password with refresh token support
  async changePassword(passwordData) {
    const url = `${API_BASE_URL}/auth/change_password`;
    logApiCall('POST', url);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const data = await handleResponse(response);
      
      // Clear tokens and redirect to login after successful password change
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      console.log('%cPassword Changed - Please Login Again', 'background: #2196f3; color: white; padding: 2px 5px; border-radius: 3px');
      window.location.href = '/auth';
      
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  // Refresh token
  async refreshToken(refreshToken) {
    const url = `${API_BASE_URL}/auth/refresh-token`;
    logApiCall('POST', url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }
};

// API per i cestini
export const binsAPI = {
  // Recupera tutti i cestini
  async getAllBins() {
    console.log('Recupero cestini dal server...');
    const response = await fetch(`${API_BASE_URL}/waste/bins`, {
      method: 'GET',
      headers: getBaseHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Dati ricevuti dal server:', data.length || 'formato non array');
    return data;
  },

  // Recupera cestini per tipo (plastica, carta, ecc)
  async getBinsByType(type) {
    // Converto in maiuscolo per uniformità
    const upperType = type.toUpperCase();
    console.log('Recupero cestini per tipo dal server:', upperType);
    
    // Preparo la richiesta
    const response = await fetch(`${API_BASE_URL}/waste/bins/type/${upperType}`, {
      method: 'GET',
      headers: getBaseHeaders()
    });
    
    // Controllo se c'è stato un errore
    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Dati filtrati ricevuti dal server');
    return data;
  },

  // Recupera cestini nelle vicinanze di coordinate geografiche
  async getNearbyBins(latitude, longitude, radius = 1000) {
    console.log(`Recupero cestini per area dal server: [${latitude}, ${longitude}]`);
    
    // Ho messo un radius default di 1km
    const response = await fetch(`${API_BASE_URL}/waste/bins/area?lat=${latitude}&lng=${longitude}&radius=${radius}`, {
      method: 'GET',
      headers: getBaseHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Dati per area ricevuti dal server');
    return data;
  }
};