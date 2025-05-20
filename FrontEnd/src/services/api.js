const API_BASE_URL = '/api';

// Funzioni helper
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    console.error('API error:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    throw new Error(data.error || 'Si è verificato un errore');
  }
  return data;
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
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        }
      });
      const data = await handleResponse(response);
      localStorage.setItem('token', data.token);
      return data;
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
  },

  // Crea un nuovo cestino
  async createBin(binData) {
    console.log('Creazione nuovo cestino...');
    
    // Assicurati che il JSON sia ben formattato rimuovendo spazi e caratteri speciali
    const cleanJSON = JSON.stringify(binData);
    
    const response = await fetch(`${API_BASE_URL}/waste/bins`, {
      method: 'POST',
      headers: {
        ...getBaseHeaders(),
        ...getAuthHeaders()
      },
      body: cleanJSON
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore creazione cestino:', errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  },
  
  // Aggiorna un cestino esistente
  async updateBin(id, binData) {
    console.log(`Aggiornamento cestino ${id}...`);
    
    // Assicurati che il JSON sia ben formattato rimuovendo spazi e caratteri speciali
    const cleanJSON = JSON.stringify(binData);
    
    const response = await fetch(`${API_BASE_URL}/waste/bins/${id}`, {
      method: 'PUT',
      headers: {
        ...getBaseHeaders(),
        ...getAuthHeaders()
      },
      body: cleanJSON
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore aggiornamento cestino:', errorText);
      throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  },
  
  // Aggiorna lo stato di un cestino
  async updateBinStatus(id, status) {
    console.log(`Aggiornamento stato cestino ${id} a ${status}...`);
    
    const response = await fetch(`${API_BASE_URL}/waste/bins/${id}/status`, {
      method: 'PUT',
      headers: {
        ...getBaseHeaders(),
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}`);
    }
    
    return await response.json();
  }
}; 