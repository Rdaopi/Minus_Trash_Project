//Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

//Simple logging helper for API calls
function logApiCall(method, url) {
  console.log(`API ${method} call to: ${url}`);
}

//Helper to handle API responses
async function handleResponse(response) {
  // Check content type to see if it's JSON
  const contentType = response.headers.get('content-type');
  console.log('Response status:', response.status);
  console.log('Response content-type:', contentType);
  console.log('Response URL:', response.url);
  
  if (!response.ok) {
    // Try to get error details, but handle HTML responses
    let errorMessage = `HTTP error ${response.status}`;
    try {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        // It's likely an HTML error page
        const errorText = await response.text();
        console.log('HTML error response:', errorText.substring(0, 500) + '...');
        errorMessage = `Server returned HTML error page (${response.status})`;
      }
    } catch (parseError) {
      console.error('Error parsing error response:', parseError);
    }
    throw new Error(errorMessage);
  }
  
  // Even if response is ok, check if it's actually JSON
  if (!contentType || !contentType.includes('application/json')) {
    const responseText = await response.text();
    console.error('Expected JSON but received:', contentType);
    console.error('Response text:', responseText.substring(0, 500) + '...');
    throw new Error(`Server returned ${contentType || 'unknown content type'} instead of JSON. This usually means the API endpoint doesn't exist or there's a server configuration issue.`);
  }
  
  try {
    return await response.json();
  } catch (jsonError) {
    console.error('JSON parsing error:', jsonError);
    const responseText = await response.text();
    console.error('Raw response that failed to parse:', responseText.substring(0, 500) + '...');
    throw new Error('Invalid JSON response from server');
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
    logApiCall('PATCH', url);
    
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
  },

  //Updates bin status
  async updateBinStatus(binId, status) {
    const url = `${API_BASE_URL}/waste/bins/${binId}/status`;
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
    const url = `${API_BASE_URL}/waste/reports`;
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
    const url = `${API_BASE_URL}/waste/reports`;
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
    const url = `${API_BASE_URL}/waste/reports/${reportId}`;
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
    const url = `${API_BASE_URL}/waste/reports/${reportId}`;
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
    const url = `${API_BASE_URL}/waste/reports/${reportId}`;
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
    
    const url = `${API_BASE_URL}/waste/reports/type/${upperType}`;
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
    
    const url = `${API_BASE_URL}/waste/reports/status/${lowerStatus}`;
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
    
    const url = `${API_BASE_URL}/waste/reports/severity/${upperSeverity}`;
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
    
    const url = `${API_BASE_URL}/waste/reports/area?lat=${latitude}&lng=${longitude}&radius=${radius}`;
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
    const url = `${API_BASE_URL}/waste/reports/${reportId}/status`;
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