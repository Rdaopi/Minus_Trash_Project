// Composable for report-related utility functions
export function useReportUtils() {
  
  // Get icon for report type
  const getReportIcon = (type, severity) => {
    const typeMap = {
      'RIFIUTI_ABBANDONATI': 'fa-trash',
      'AREA_SPORCA': 'fa-broom',
      'PROBLEMA_CESTINO': 'fa-trash-can',
      'RACCOLTA_SALTATA': 'fa-clock',
      'VANDALISMO': 'fa-hammer',
      'SCARICO_ILLEGALE': 'fa-ban',
      'ALTRO': 'fa-exclamation',
      'OVERFLOW': 'fa-trash-can-arrow-up',
      'DAMAGE': 'fa-hammer',
      'MISSING': 'fa-question-circle',
      'MAINTENANCE': 'fa-tools',
      'OTHER': 'fa-exclamation-triangle',
      'default': 'fa-flag'
    };
    return typeMap[type?.toUpperCase()] || typeMap.default;
  };

  // Get color for report based on severity
  const getReportColor = (severity) => {
    const colorMap = {
      'BASSA': '#FFC107',    // Yellow - Low priority
      'MEDIA': '#FF9800',    // Orange - Medium priority  
      'ALTA': '#F44336',     // Red - High priority
      'URGENTE': '#8E24AA',  // Purple - Urgent
      'HIGH': '#F44336',     // Red - High priority
      'MEDIUM': '#FF9800',   // Orange - Medium priority  
      'LOW': '#FFC107',      // Yellow - Low priority
      'default': '#FF9800'   // Orange as fallback
    };
    
    return colorMap[severity?.toUpperCase()] || colorMap.default;
  };

  // Format report type for display
  const formatReportType = (type) => {
    const typeLabels = {
      'RIFIUTI_ABBANDONATI': 'Rifiuti Abbandonati',
      'AREA_SPORCA': 'Area Sporca',
      'PROBLEMA_CESTINO': 'Problema Cestino',
      'RACCOLTA_SALTATA': 'Raccolta Saltata',
      'VANDALISMO': 'Vandalismo',
      'SCARICO_ILLEGALE': 'Scarico Illegale',
      'ALTRO': 'Altro'
    };
    return typeLabels[type?.toUpperCase()] || type || 'Segnalazione';
  };

  // Format report subtype for display
  const formatReportSubtype = (subtype) => {
    const subtypeLabels = {
      // Bin subtypes
      'ROTTO': 'Rotto',
      'PIENO': 'Pieno',
      'MANCANTE': 'Mancante',
      'SPORCO': 'Sporco',
      // Waste types
      'PLASTICA': 'Plastica',
      'CARTA': 'Carta',
      'VETRO': 'Vetro',
      'ORGANICO': 'Organico',
      'RAEE': 'RAEE',
      'INGOMBRANTI': 'Ingombranti',
      'INDIFFERENZIATO': 'Indifferenziato',
      'ALTRO': 'Altro'
    };
    return subtypeLabels[subtype?.toUpperCase()] || subtype;
  };

  // Format report status for display
  const formatReportStatus = (status) => {
    const statusLabels = {
      'segnalato': 'Segnalato',
      'verificato': 'Verificato',
      'in_corso': 'In Corso',
      'risolto': 'Risolto',
      'archiviato': 'Archiviato'
    };
    return statusLabels[status?.toLowerCase()] || status || 'Segnalato';
  };

  // Get severity class for styling
  const getSeverityClass = (severity) => {
    const severityMap = {
      'BASSA': 'severity-low',
      'MEDIA': 'severity-medium', 
      'ALTA': 'severity-high',
      'URGENTE': 'severity-urgent',
      'LOW': 'severity-low',
      'MEDIUM': 'severity-medium', 
      'HIGH': 'severity-high',
      'URGENT': 'severity-urgent'
    };
    return severityMap[severity?.toUpperCase()] || 'severity-low';
  };

  // Format report address
  const formatReportAddress = (report) => {
    if (!report) return 'Indirizzo non disponibile';
    
    if (report.address && typeof report.address === 'string') {
      return report.address;
    }
    
    if (report.location && report.location.address) {
      if (typeof report.location.address === 'string') {
        return report.location.address;
      }
      
      if (typeof report.location.address === 'object') {
        const address = report.location.address;
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.streetNumber) parts.push(address.streetNumber);
        if (address.city) parts.push(address.city);
        
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    }
    
    // Fallback to coordinates if no address
    if (report.location?.coordinates) {
      const [lng, lat] = report.location.coordinates;
      return `Coordinate: ${lat?.toFixed(4)}, ${lng?.toFixed(4)}`;
    }
    
    return 'Indirizzo non disponibile';
  };

  // Get report coordinates (handles different formats)
  const getReportCoordinates = (report) => {
    if (!report) return null;

    // Direct lat/lng properties
    if (report.lat && report.lng) {
      return {
        latitude: parseFloat(report.lat),
        longitude: parseFloat(report.lng)
      };
    }

    // Alternative latitude/longitude properties
    if (report.latitude && report.longitude) {
      return {
        latitude: parseFloat(report.latitude),
        longitude: parseFloat(report.longitude)
      };
    }

    // GeoJSON format
    if (report.location?.coordinates) {
      const [lng, lat] = report.location.coordinates;
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      };
    }

    return null;
  };

  // Get report ID (handles both _id and id)
  const getReportId = (report) => {
    return report?.id || report?._id || null;
  };

  return {
    getReportIcon,
    getReportColor,
    formatReportType,
    formatReportSubtype,
    formatReportStatus,
    getSeverityClass,
    formatReportAddress,
    getReportCoordinates,
    getReportId
  };
} 