//Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

//Simple logging helper for API calls
function logApiCall(method, url) {
  console.log(`API ${method} call to: ${url}`);
}

//Helper to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }
  return await response.json();
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

//Grabs the auth token for protected routes
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

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
        const data = await handleResponse(response);
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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  //Cleans up user session
  logout() {
    localStorage.removeItem('token');
    //TODO: Implement server-side token invalidation in the future
  }
};

//Waste bin management API endpoints
export const binsAPI = {
  //Creates a new waste bin
  async createBin(binData) {
    const url = `${API_BASE_URL}/waste/bins`;
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
        body: JSON.stringify(binData)
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('Error creating bin:', error);
      throw new Error('Failed to create waste bin');
    }
  },

  //Fetches all waste bins
  async getAllBins() {
    const url = `${API_BASE_URL}/waste/bins`;
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        headers: getBaseHeaders()
      });
      
      const data = await handleResponse(response);
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
    const url = `${API_BASE_URL}/waste/bins/${binId}`;
    logApiCall('GET', url);
    
    try {
      const response = await fetch(url, {
        headers: getBaseHeaders()
      });
      
      const data = await handleResponse(response);
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
    const url = `${API_BASE_URL}/waste/bins/${binId}`;
    console.log('=== API UPDATE BIN DEBUG ===');
    console.log('URL:', url);
    console.log('Bin ID:', binId);
    console.log('Bin Data:', binData);
    logApiCall('PUT', url);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('ERROR: No auth token found');
        throw new Error('No auth token found');
      }
      console.log('Token found:', token.substring(0, 20) + '...');

      const requestBody = JSON.stringify(binData);
      console.log('Request body:', requestBody);

      const response = await fetch(url, {
        method: 'PUT',
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
      console.error('Error updating bin:', error);
      console.error('Error stack:', error.stack);
      throw new Error('Failed to update waste bin: ' + error.message);
    }
  },

  //Removes a waste bin from the system
  async deleteBin(binId) {
    const url = `${API_BASE_URL}/waste/bins/${binId}`;
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
      console.error('Error deleting bin:', error);
      throw new Error('Failed to delete waste bin');
    }
  },

  //Fetches bins by waste type (plastic, paper, etc)
  async getBinsByType(type) {
    //Convert to uppercase for consistency
    const upperType = type.toUpperCase();
    console.log('Fetching bins by type:', upperType);
    
    //Prepare and send request
    const response = await fetch(`${API_BASE_URL}/waste/bins/type/${upperType}`, {
      method: 'GET',
      headers: getBaseHeaders()
    });
    
    //Check for errors
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched filtered bins');
    return data;
  },

  //Finds bins near a geographic location
  async getNearbyBins(latitude, longitude, radius = 1000) {
    console.log(`Finding bins near [${latitude}, ${longitude}]`);
    
    //Default radius is 1km
    const response = await fetch(`${API_BASE_URL}/waste/bins/area?lat=${latitude}&lng=${longitude}&radius=${radius}`, {
      method: 'GET',
      headers: getBaseHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched nearby bins');
    return data;
  }
}; 