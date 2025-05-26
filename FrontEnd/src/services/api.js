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
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

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
        localStorage.setItem('token', data.token);
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
  logout() {
    localStorage.removeItem('token');
    // in futuro potrei aggiungere invalidazione token lato server
  },

  // Change password
  async changePassword(passwordData) {
    const url = `${API_BASE_URL}/auth/change_password`;
    logApiCall('POST', url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const data = await handleResponse(response);
      return data;
    } catch (error) {
      console.error('Change password error:', error);
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