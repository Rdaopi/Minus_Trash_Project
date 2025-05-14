const API_BASE_URL = '/api';

// Funzioni helper
const handleResponse = async (response) => {
  if (!response.ok) {
    console.error('API error:', response.status, response.statusText);
    const error = await response.json().catch(e => ({ message: 'Errore di parsing JSON' }));
    throw error;
  }
  return response.json();
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
  if (body) console.log('Body:', body);
};

// API per l'autenticazione
export const authAPI = {
  // Login con email e password
  async login(email, password) {
    const url = `${API_BASE_URL}/auth/login`;
    logApiCall('POST', url);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await handleResponse(response);
      localStorage.setItem('token', data.token);
      return data;
    } catch (error) {
      // TODO: migliorare gestione errori
      console.error('Login error:', error);
      throw error;
    }
  },

  // Registrazione nuovo utente
  async register(userData) {
    const url = `${API_BASE_URL}/auth/register`;
    logApiCall('POST', url, userData);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout (rimuove il token)
  logout() {
    localStorage.removeItem('token');
    // in futuro potrei aggiungere invalidazione token lato server
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