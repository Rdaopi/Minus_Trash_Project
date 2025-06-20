//const API_BASE_URL = '/api';
// Get the API base URL from environment variable or fallback to relative path
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
//Simple logging helper for API calls
function logApiCall(method, url) {
  console.log(`API ${method} call to: ${url}`);
}

// Funzioni helper
const handleResponse = async (response, originalRequest, isPublic = false) => {
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
      if (response.status === 401 && !isPublic) {
        // Token expired or invalid
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          clearAuthData();
          window.location.href = '/auth';
        } else {
          // Try to refresh the token ONCE and retry the original request
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ refreshToken })
            });
            if (!refreshResponse.ok) throw new Error('Refresh token invalid');
            const newTokens = await refreshResponse.json();
            localStorage.setItem('token', newTokens.accessToken);
            localStorage.setItem('refreshToken', newTokens.refreshToken);
            // Retry the original request with the new token
            if (originalRequest) {
              // Update Authorization header
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
              } else {
                originalRequest.headers = { 'Authorization': `Bearer ${newTokens.accessToken}` };
              }
              const retryResponse = await fetch(originalRequest.url, originalRequest);
              return await handleResponse(retryResponse, { url: originalRequest.url, ...originalRequest });
            }
          } catch (refreshError) {
            clearAuthData();
            window.location.href = '/auth';
            throw new Error('Sessione scaduta. Effettua nuovamente il login.');
          }
        }
      }
      console.error('API error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.error || data.message || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error('Response handling error:', error);
    throw error
  }
}

//Get base headers for requests
function getBaseHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}


// Function to check if token is expired  
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeLeft = expirationTime - currentTime;
    
    if (timeLeft > 0) {
      console.log(`%cAccess Token valid for ${Math.round(timeLeft/1000)}s`, 'background: #4caf50; color: white; padding: 2px 5px; border-radius: 3px');
      return false;
    } else {
      console.log('%cAccess Token Expired', 'background: #ff9800; color: white; padding: 2px 5px; border-radius: 3px');
      return true;
    }
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

let hasLoggedNoToken = false;
setInterval(async () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!token) {
    if (!hasLoggedNoToken) {
      console.log('%c[Interval] No access token found', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px');
      hasLoggedNoToken = true;
    }
    return;
  }
  hasLoggedNoToken = false;
  let timeLeft = null;
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000;
    const currentTime = Date.now();
    timeLeft = expirationTime - currentTime;
    console.log(`%c[Interval] Token check at ${new Date(currentTime).toLocaleTimeString()} | Expires in: ${Math.round(timeLeft/1000)}s`, 'background: #2196f3; color: white; padding: 2px 5px; border-radius: 3px');
  } catch (e) {
    console.error('[Interval] Error parsing token:', e);
    timeLeft = null;
  }
  // Proactive refresh: if less than 10 seconds left, refresh
  if (token && (isTokenExpired(token) || (timeLeft !== null && timeLeft < 10000))) {
    if (timeLeft !== null && timeLeft > 0) {
      console.log('%c[Interval] Token about to expire, refreshing early', 'background: #ffeb3b; color: black; padding: 2px 5px; border-radius: 3px');
    }
    console.log('%c[Interval] Token expired or about to expire, attempting refresh', 'background: #ff9800; color: white; padding: 2px 5px; border-radius: 3px');

    if (!refreshToken) {
      console.log('%c[Interval] No refresh token available - Logging out', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px');
      clearAuthData();
      window.location.href = '/auth';
    } else {
      // Attempt to refresh the token
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });
        if (!response.ok) {
          console.error('[Interval] Refresh token request failed:', response.status, response.statusText);
        }
        const newTokens = await handleResponse(response, null, true);
        localStorage.setItem('token', newTokens.accessToken);
        localStorage.setItem('refreshToken', newTokens.refreshToken);
        console.log('%c[Interval] Token refreshed successfully', 'background: #4caf50; color: white; padding: 2px 5px; border-radius: 3px');
      } catch (error) {
        console.error('[Interval] Failed to refresh token in interval check:', error);
        clearAuthData();
        window.location.href = '/auth';
      }
    }
  }
}, 10000); // Check every 10 seconds

// Prelevo i token per le richieste autenticate
const getAuthHeaders = async () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!token) {
    if (!refreshToken) {
      clearAuthData();
      window.location.href = '/auth';
      throw new Error('No authentication tokens available');
    }
    // Try to refresh the token
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      const newTokens = await handleResponse(response, null, true);
      localStorage.setItem('token', newTokens.accessToken);
      localStorage.setItem('refreshToken', newTokens.refreshToken);
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newTokens.accessToken}`
      };
    } catch (error) {
      clearAuthData();
      window.location.href = '/auth';
      throw new Error('Failed to refresh token');
    }
  }

  // Check if current token is expired
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = tokenData.exp * 1000;
    const currentTime = Date.now();
    
    // If token is expired or will expire in next 30 seconds, try to refresh
    if (currentTime >= (expirationTime - 30000)) {
      if (!refreshToken) {
        clearAuthData();
        window.location.href = '/auth';
        throw new Error('No refresh token available');
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });
        const newTokens = await handleResponse(response, null, true);
        localStorage.setItem('token', newTokens.accessToken);
        localStorage.setItem('refreshToken', newTokens.refreshToken);
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newTokens.accessToken}`
        };
      } catch (error) {
        clearAuthData();
        window.location.href = '/auth';
        throw new Error('Failed to refresh token');
      }
    }
  } catch (error) {
    console.error('Error parsing token:', error);
  }

  // Use current token
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to clear auth data
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('authMethod');
  localStorage.removeItem('userName');
  localStorage.removeItem('userSurname');
  localStorage.removeItem('userUsername');
  localStorage.removeItem('userRole');
};

//Authentication related API endpoints
export const authAPI = {
  //Handles user login with email/password
  async login(email, password) {
    const url = `${API_BASE_URL}/auth/login`;
    logApiCall('POST', url);
    try {
      //Create base64 credentials for Basic Auth
      const credentials = btoa(`${email}:${password}`);
      
      //Set a reasonable timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); //15s timeout
      
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

        // Handle non-200 responses before trying to parse JSON
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Email o password non corretti');
          }
          if (response.status === 403) {
            // Try to parse the error message for blocked accounts
            const errorData = await response.json();
            throw new Error(errorData.error || 'Account bloccato');
          }
          throw new Error('Errore durante il login');
        }

        const data = await handleResponse(response, null, true);
        console.log('Login response data:', data);
        if (data.user && data.user.role) {
          console.log('User role from response:', data.user.role);
        } else {
          console.log('No user role found in response');
        }
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Login request timed out. Check your internet connection.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  //Handles new user registration
  async register(userData) {
    const url = `${API_BASE_URL}/auth/register`;
    logApiCall('POST', url);
    
    try {
      const requestOptions = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) };
      const response = await fetch(url, requestOptions);
      return await handleResponse(response, { url, ...requestOptions });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout (rimuove il token)
  async logout(refreshToken) {
      const url = `${API_BASE_URL}/logout`;
      logApiCall('POST', url);
      try {
        const requestOptions = { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ refreshToken }) };
        const response = await fetch(url, requestOptions);
        return await handleResponse(response, requestOptions);
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },

  // Change password with refresh token support
  async changePassword(passwordData) {
    const url = `${API_BASE_URL}/users/me/password`;
    logApiCall('PATCH', url);
    try {
      const headers = await getAuthHeaders();
      const requestOptions = { method: 'PATCH', headers, body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }) };
      const response = await fetch(url, requestOptions);
      const data = await handleResponse(response, requestOptions);
      
      // Clear tokens but let the component handle redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      console.log('%cPassword Changed Successfully - Tokens Cleared', 'background: #2196f3; color: white; padding: 2px 5px; border-radius: 3px');
      
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
      const requestOptions = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) };
      const response = await fetch(url, requestOptions);
      return await handleResponse(response, requestOptions);
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },

  // Request password reset
  async requestPasswordReset(email) {
    const url = `${API_BASE_URL}/forgot-password`;
    logApiCall('POST', url);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      const requestOptions = { method: 'POST', headers, body: JSON.stringify({ email }) };
      const response = await fetch(url, requestOptions);
      
      return handleResponse(response, requestOptions, true);
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  // Reset password with token
  async resetPassword(token, password) {
    const url = `${API_BASE_URL}/reset-password`;
    
    logApiCall('POST', url);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      const requestOptions = { method: 'POST', headers, body: JSON.stringify({ token, password }) };
      const response = await fetch(url, requestOptions);
      return handleResponse(response, requestOptions, true);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Update user profile (PATCH /api/users/me)
  async updateProfile(profileData) {
    const url = `${API_BASE_URL}/users/me`;
    logApiCall('PATCH', url);
    try {
      const headers = await getAuthHeaders();
      const requestOptions = { method: 'PATCH', headers, body: JSON.stringify(profileData) };
      const response = await fetch(url, requestOptions);
      return await handleResponse(response, requestOptions);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Get current user profile
  async getProfile() {
    const url = `${API_BASE_URL}/users/me`;
    logApiCall('GET', url);
    try {
      const headers = await getAuthHeaders();
      const requestOptions = { method: 'GET', headers };
      const response = await fetch(url, requestOptions);
      return await handleResponse(response, requestOptions);
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }
};

//Waste bin management API endpoints
export const binsAPI = {
  //Creates a new bin
  async createBin(binData) {
    const url = `${API_BASE_URL}/bins`;
    logApiCall('POST', url);
    
    try {
      const headers = await getAuthHeaders();
      const requestOptions = { method: 'POST', headers, body: JSON.stringify(binData) };
      const response = await fetch(url, requestOptions);
      return await handleResponse(response, { url, ...requestOptions });
    } catch (error) {
      console.error('Error creating bin:', error);
      throw new Error('Failed to create waste bin');
    }
  },

  //Fetches all waste bins
  async getAllBins() {
    const url = `${API_BASE_URL}/bins`;
    logApiCall('GET', url);
    
    try {
      let headers;
      let isPublic = false;
      if (localStorage.getItem('token')) {
        headers = await getAuthHeaders();
      } else {
        headers = { 'Content-Type': 'application/json' };
        isPublic = true;
      }
      const requestOptions = { headers };
      const response = await fetch(url, requestOptions);
      
      const data = await handleResponse(response, requestOptions, isPublic);
      console.log('Raw bins data from server:', data);
      
      // Ensure we have an array of bins with proper coordinates
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected array');
      }
      
      // Transform location data to lat/lng format if needed
      const transformedBins = data.map(bin => {
        console.log('Processing bin:', bin);
        let transformedBin = {
          ...bin,
          address: 'Indirizzo non disponibile'
        };

        // Handle coordinates
        if (bin.location && bin.location.coordinates) {
          transformedBin.lng = bin.location.coordinates[0];
          transformedBin.lat = bin.location.coordinates[1];
        }

        // Handle address - check all possible sources
        if (bin.street && bin.streetNumber) {
          transformedBin.address = `${bin.street}, ${bin.streetNumber}`;
        } else if (bin.address && typeof bin.address === 'object') {
          if (bin.address.street) {
            transformedBin.street = bin.address.street;
            transformedBin.streetNumber = bin.address.streetNumber || '';
            transformedBin.address = bin.address.streetNumber ? 
              `${bin.address.street}, ${bin.address.streetNumber}` : 
              bin.address.street;
          }
        } else if (bin.location && bin.location.address) {
          transformedBin.address = bin.location.address;
        } else if (typeof bin.address === 'string' && bin.address) {
          transformedBin.address = bin.address;
        }

        console.log('Transformed bin address:', transformedBin.address);
        return transformedBin;
      });
      
      console.log('Transformed bins:', transformedBins);
      return transformedBins;
    } catch (error) {
      console.error('Error fetching bins:', error);
      throw new Error('Failed to fetch waste bins: ' + error.message);
    }
  },

  //Fetches a single waste bin by ID
  async getBinById(binId) {
    const url = `${API_BASE_URL}/bins/${binId}`;
    logApiCall('GET', url);
    
    try {
      let headers;
      let isPublic = false;
      if (localStorage.getItem('token')) {
        headers = await getAuthHeaders();
      } else {
        headers = { 'Content-Type': 'application/json' };
        isPublic = true;
      }
      const requestOptions = { headers };
      const response = await fetch(url, requestOptions);
      
      const data = await handleResponse(response, requestOptions, isPublic);
      console.log('Raw bin data from server:', data);
      
      // Transform location data to lat/lng format if needed
      let transformedBin = {
        ...data,
        address: 'Indirizzo non disponibile'
      };

      // Handle coordinates
      if (data.location && data.location.coordinates) {
        transformedBin.lng = data.location.coordinates[0];
        transformedBin.lat = data.location.coordinates[1];
      }

      // Handle address - check all possible sources
      if (data.street && data.streetNumber) {
        transformedBin.address = `${data.street}, ${data.streetNumber}`;
      } else if (data.address && typeof data.address === 'object') {
        if (data.address.street) {
          transformedBin.street = data.address.street;
          transformedBin.streetNumber = data.address.streetNumber || '';
          transformedBin.address = data.address.streetNumber ? 
            `${data.address.street}, ${data.address.streetNumber}` : 
            data.address.street;
        }
      } else if (data.location && data.location.address) {
        transformedBin.address = data.location.address;
      } else if (typeof data.address === 'string' && data.address) {
        transformedBin.address = data.address;
      }

      console.log('Transformed bin:', transformedBin);
      return transformedBin;
    } catch (error) {
      console.error('Error fetching bin by ID:', error);
      throw new Error(`Failed to fetch bin details: ${error.message}`);
    }
  },

  //Updates an existing waste bin
  async updateBin(binId, binData) {
    const url = `${API_BASE_URL}/bins/${binId}`;
    console.log('=== API UPDATE BIN DEBUG ===');
    console.log('URL:', url);
    console.log('Bin ID:', binId);
    console.log('Bin Data:', binData);
    logApiCall('PATCH', url);
    
    try {
      const headers = await getAuthHeaders();
      console.log('Headers prepared for request');

      //const requestOptions = { method: 'PUT', headers, body: JSON.stringify(binData) };   //this will raise token error
      const requestOptions = { method: 'PATCH', headers, body: JSON.stringify(binData) };
      console.log('Request body:', requestOptions.body);
      /*
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`
        },
        body: requestBody
      });
      */
      const response = await fetch(url, requestOptions);

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const result = await handleResponse(response, requestOptions);
      console.log('=== UPDATE SUCCESS ===');
      console.log('Update result:', result);
      return result;
    } catch (error) {
      console.error('=== ERROR IN UPDATE API ===');
      console.error('Error updating bin:', error);
      console.error('Error stack:', error.stack);
      throw new Error('Failed to update waste bin: ' + error.message);
    }
  },

  //Removes a waste bin from the system
  async deleteBin(binId) {
    const url = `${API_BASE_URL}/bins/${binId}`;
    logApiCall('DELETE', url);
    
    try {
      const headers = await getAuthHeaders();
      const requestOptions = { method: 'DELETE', headers };
      const response = await fetch(url, requestOptions);

      return await handleResponse(response, requestOptions);
    } catch (error) {
      console.error('Error deleting bin:', error);
      throw new Error('Failed to delete waste bin');
    }
  },

  //Fetches bins by waste type (plastic, paper, etc)
  async getBinsByType(type) {
    //Convert to uppercase for consistency
    const upperType = type.toUpperCase();
    console.log('Fetching bins by type:', upperType);
    
    try {
      let headers;
      let isPublic = false;
      if (localStorage.getItem('token')) {
        headers = await getAuthHeaders();
      } else {
        headers = { 'Content-Type': 'application/json' };
        isPublic = true;
      }
      const requestOptions = { method: 'GET', headers };
      const response = await fetch(`${API_BASE_URL}/bins/type/${upperType}`, requestOptions);
      
      //Check for errors
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await handleResponse(response, requestOptions, isPublic);
      console.log('Successfully fetched filtered bins');
      return data;
    } catch (error) {
      console.error('Error fetching bins by type:', error);
      throw error;
    }
  },

  //Finds bins near a geographic location
  async getNearbyBins(latitude, longitude, radius = 1000) {
    console.log(`Finding bins near [${latitude}, ${longitude}]`);
    
    try {
      let headers;
      let isPublic = false;
      if (localStorage.getItem('token')) {
        headers = await getAuthHeaders();
      } else {
        headers = { 'Content-Type': 'application/json' };
        isPublic = true;
      }
      const requestOptions = { method: 'GET', headers };
      const response = await fetch(`${API_BASE_URL}/bins/area?lat=${latitude}&lng=${longitude}&radius=${radius}`, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await handleResponse(response, requestOptions, isPublic);
      console.log('Successfully fetched nearby bins');
      return data;
    } catch (error) {
      console.error('Error fetching nearby bins:', error);
      throw error;
    }
    const data = await response.json();
    console.log('Successfully fetched nearby bins');
    return data;
  },

  //Updates bin status
  async updateBinStatus(binId, status) {
    const url = `${API_BASE_URL}/bins/${binId}/status`;
    console.log('Updating bin status:', binId, 'to', status);
    logApiCall('PATCH', url);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating bin status:', error);
      throw new Error('Failed to update bin status: ' + error.message);
    }
  }
};

//Report management API endpoints
export const reportsAPI = {
  //Creates a new report
  async createReport(reportData) {
    const url = `${API_BASE_URL}/reports`;
    logApiCall('POST', url);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error('Failed to create report: ' + error.message);
    }
  },

  //Fetches all reports
  async getAllReports() {
    const url = `${API_BASE_URL}/reports`;
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        headers: getBaseHeaders()
      });
      
      const data = await handleResponse(response);
      console.log('Raw reports data from server:', data);
      
      // Ensure we have an array of reports
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected array');
      }
      
      // Transform report data if needed
      const transformedReports = data.map(report => {
        console.log('Processing report:', report);
        let transformedReport = {
          ...report,
          address: 'Indirizzo non disponibile'
        };

        // Handle address formatting for display
        if (report.location && report.location.address) {
          if (typeof report.location.address === 'string') {
            transformedReport.address = report.location.address;
          } else if (typeof report.location.address === 'object') {
            const address = report.location.address;
            const parts = [];
            
            if (address.street) parts.push(address.street);
            if (address.streetNumber) parts.push(address.streetNumber);
            if (address.city) parts.push(address.city);
            
            if (parts.length > 0) {
              transformedReport.address = parts.join(', ');
            }
          }
        } else if (report.location?.coordinates) {
          // Fallback to coordinates if no address
          const [lng, lat] = report.location.coordinates;
          transformedReport.address = `Coordinate: ${lat?.toFixed(4)}, ${lng?.toFixed(4)}`;
        }

        console.log('Transformed report address:', transformedReport.address);
        return transformedReport;
      });
      
      console.log('Transformed reports:', transformedReports);
      return transformedReports;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Failed to fetch reports: ' + error.message);
    }
  },

  //Fetches a single report by ID
  async getReportById(reportId) {
    const url = `${API_BASE_URL}/reports/${reportId}`;
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        headers: getBaseHeaders()
      });
      
      const data = await handleResponse(response);
      console.log('Raw report data from server:', data);
      
      // Transform report data if needed
      let transformedReport = {
        ...data,
        address: 'Indirizzo non disponibile'
      };

      // Handle address formatting
      if (data.location && data.location.address) {
        if (typeof data.location.address === 'string') {
          transformedReport.address = data.location.address;
        } else if (typeof data.location.address === 'object') {
          const address = data.location.address;
          const parts = [];
          
          if (address.street) parts.push(address.street);
          if (address.streetNumber) parts.push(address.streetNumber);
          if (address.city) parts.push(address.city);
          if (address.postalCode) parts.push(address.postalCode);
          
          if (parts.length > 0) {
            transformedReport.address = parts.join(', ');
          }
        }
      } else if (data.location?.coordinates) {
        // Fallback to coordinates if no address
        const [lng, lat] = data.location.coordinates;
        transformedReport.address = `Coordinate: ${lat?.toFixed(4)}, ${lng?.toFixed(4)}`;
      }

      console.log('Transformed report:', transformedReport);
      return transformedReport;
    } catch (error) {
      console.error('Error fetching report by ID:', error);
      throw new Error(`Failed to fetch report details: ${error.message}`);
    }
  },

  //Updates an existing report
  async updateReport(reportId, reportData) {
    const url = `${API_BASE_URL}/reports/${reportId}`;
    console.log('=== API UPDATE REPORT DEBUG ===');
    console.log('URL:', url);
    console.log('Report ID:', reportId);
    console.log('Report Data:', reportData);
    logApiCall('PATCH', url);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('ERROR: No auth token found');
        throw new Error('No auth token found');
      }
      console.log('Token found:', token.substring(0, 20) + '...');

      const requestBody = JSON.stringify(reportData);
      console.log('Request body:', requestBody);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: requestBody
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const result = await handleResponse(response);
      console.log('=== UPDATE SUCCESS ===');
      console.log('Update result:', result);
      return result;
    } catch (error) {
      console.error('=== ERROR IN UPDATE API ===');
      console.error('Error updating report:', error);
      console.error('Error stack:', error.stack);
      throw new Error('Failed to update report: ' + error.message);
    }
  },

  //Removes a report from the system
  async deleteReport(reportId) {
    const url = `${API_BASE_URL}/reports/${reportId}`;
    logApiCall('DELETE', url);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error('Failed to delete report: ' + error.message);
    }
  },

  //Fetches reports by type
  async getReportsByType(type) {
    const upperType = type.toUpperCase();
    console.log('Fetching reports by type:', upperType);
    
    const url = `${API_BASE_URL}/reports/type/${upperType}`;
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getBaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched filtered reports by type');
      return data;
    } catch (error) {
      console.error('Error fetching reports by type:', error);
      throw new Error('Failed to fetch reports by type: ' + error.message);
    }
  },

  //Fetches reports by status
  async getReportsByStatus(status) {
    const lowerStatus = status.toLowerCase();
    console.log('Fetching reports by status:', lowerStatus);
    
    const url = `${API_BASE_URL}/reports/status/${lowerStatus}`;
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getBaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched filtered reports by status');
      return data;
    } catch (error) {
      console.error('Error fetching reports by status:', error);
      throw new Error('Failed to fetch reports by status: ' + error.message);
    }
  },

  //Fetches reports by severity
  async getReportsBySeverity(severity) {
    const upperSeverity = severity.toUpperCase();
    console.log('Fetching reports by severity:', upperSeverity);
    
    const url = `${API_BASE_URL}/reports/severity/${upperSeverity}`;
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getBaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched filtered reports by severity');
      return data;
    } catch (error) {
      console.error('Error fetching reports by severity:', error);
      throw new Error('Failed to fetch reports by severity: ' + error.message);
    }
  },

  //Finds reports near a geographic location
  async getNearbyReports(latitude, longitude, radius = 1000) {
    console.log(`Finding reports near [${latitude}, ${longitude}]`);
    
    const url = `${API_BASE_URL}/reports/area?lat=${latitude}&lng=${longitude}&radius=${radius}`;
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getBaseHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched nearby reports');
      return data;
    } catch (error) {
      console.error('Error fetching nearby reports:', error);
      throw new Error('Failed to fetch nearby reports: ' + error.message);
    }
  },

  //Updates report status
  async updateReportStatus(reportId, status) {
    const url = `${API_BASE_URL}/reports/${reportId}/status`;
    console.log('Updating report status:', reportId, 'to', status);
    logApiCall('PATCH', url);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating report status:', error);
      throw new Error('Failed to update report status: ' + error.message);
    }

  }
};