// Composable for bin-related utility functions
export function useBinUtils() {
  
  // Get icon class for bin type
  const getBinIcon = (type) => {
    const typeMap = {
      'PLASTICA': 'fa-bottle-water',
      'CARTA': 'fa-newspaper',
      'VETRO': 'fa-wine-bottle',
      'INDIFFERENZIATO': 'fa-solid fa-trash',
      'ORGANICO': 'fa-apple-whole',
      'RAEE': 'fa-laptop',
      'default': 'fa-trash-can'
    };
    
    return typeMap[type?.toUpperCase()] || typeMap.default;
  };

  // Get color for bin type
  const getBinColor = (type) => {
    const colorMap = {
      'PLASTICA': '#ffeb3b',  // Yellow
      'CARTA': '#2196f3',     // Blue
      'VETRO': '#4caf50',     // Green
      'INDIFFERENZIATO': '#9e9e9e', // Gray
      'ORGANICO': '#795548',  // Brown
      'RAEE': '#f44336',      // Red
      'default': '#9e9e9e'    // Gray as fallback
    };
    
    return colorMap[type?.toUpperCase()] || colorMap.default;
  };

  // Get color based on fill level
  const getFillLevelColor = (level) => {
    if (level >= 80) return '#F44336'; // Red
    if (level >= 50) return '#FFC107'; // Yellow
    return '#4CAF50'; // Green
  };

  // Format bin address
  const formatBinAddress = (bin) => {
    if (!bin) return 'Indirizzo non disponibile';
    
    if (bin.address && typeof bin.address === 'string') {
      return bin.address;
    }
    
    if (bin.location && bin.location.address) {
      if (typeof bin.location.address === 'string') {
        return bin.location.address;
      }
      
      if (typeof bin.location.address === 'object') {
        const address = bin.location.address;
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.streetNumber) parts.push(address.streetNumber);
        if (address.city) parts.push(address.city);
        if (address.postalCode) parts.push(address.postalCode);
        
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    }

    // Try alternative formats
    const parts = [];
    if (bin.street) parts.push(bin.street);
    if (bin.streetNumber) parts.push(bin.streetNumber);
    if (bin.city) parts.push(bin.city);
    if (bin.cap) parts.push(bin.cap);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    // Fallback to coordinates
    if (bin.lat && bin.lng) {
      return `Coordinate: ${bin.lat.toFixed(4)}, ${bin.lng.toFixed(4)}`;
    }
    
    if (bin.location?.coordinates) {
      const [lng, lat] = bin.location.coordinates;
      return `Coordinate: ${lat?.toFixed(4)}, ${lng?.toFixed(4)}`;
    }
    
    return 'Indirizzo non disponibile';
  };

  // Get coordinates from bin object (handles multiple formats)
  const getBinCoordinates = (bin) => {
    if (!bin) return null;

    // Direct lat/lng properties
    if (bin.lat && bin.lng) {
      return {
        latitude: parseFloat(bin.lat),
        longitude: parseFloat(bin.lng)
      };
    }

    // Alternative latitude/longitude properties
    if (bin.latitude && bin.longitude) {
      return {
        latitude: parseFloat(bin.latitude),
        longitude: parseFloat(bin.longitude)
      };
    }

    // GeoJSON format
    if (bin.location?.coordinates) {
      const [lng, lat] = bin.location.coordinates;
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      };
    }

    return null;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponibile';
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch {
      return 'Data non valida';
    }
  };

  // Get bin ID (handles both _id and id)
  const getBinId = (bin) => {
    return bin?.id || bin?._id || null;
  };

  return {
    getBinIcon,
    getBinColor,
    getFillLevelColor,
    formatBinAddress,
    getBinCoordinates,
    formatDate,
    getBinId
  };
} 