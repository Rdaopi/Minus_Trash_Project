<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container" style="height: 500px; width: 100%"></div>
    
    <!-- Bin Report Modal -->
    <BinReportModal
      :show="showReportModal"
      :bin="selectedBinForReport"
      @close="closeReportModal"
      @success="handleReportSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'
import BinReportModal from './BinReportModal.vue'
import { useBinUtils } from '../composables/useBinUtils'
import { useReportUtils } from '../composables/useReportUtils'

const props = defineProps({
  bins: {
    type: Array,
    required: false,
    default: () => []
  },
  reports: {
    type: Array,
    required: false,
    default: () => []
  },
  selectedBinId: {
    type: String,
    default: null
  },
  selectedReportId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['bin-click', 'report-click', 'report-created'])

// Use utility composables
const {
  getBinIcon,
  getBinColor,
  getFillLevelColor,
  formatBinAddress,
  getBinCoordinates,
  getBinId
} = useBinUtils()

const {
  getReportIcon,
  getReportColor,
  formatReportAddress,
  getReportCoordinates,
  getReportId
} = useReportUtils()

const mapContainer = ref(null)
let map = null // reference to the Leaflet map
let markers = [] // array to keep track of markers
let mapInitialized = ref(false) // Track if map is initialized

// Report modal state
const showReportModal = ref(false)
const selectedBinForReport = ref(null)

// Function to create a custom report marker
const createReportMarker = (type, severity) => {
  const color = getReportColor(severity);
  const iconClass = getReportIcon(type, severity);
  
  const customIcon = L.divIcon({
    className: 'custom-report-marker',
    html: `
      <div class="report-marker-container" style="background-color: ${color}; border: 2px solid ${color};">
        <i class="fas ${iconClass}" style="color: white;"></i>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  return customIcon;
};

// Center the map on a specific bin
function centerOnBin(bin) {
  if (!map || !bin.latitude || !bin.longitude) return;
  
  const lat = parseFloat(bin.latitude);
  const lng = parseFloat(bin.longitude);
  
  if (isNaN(lat) || isNaN(lng)) return;
  
  map.setView([lat, lng], 18, {
    animate: true,
    duration: 1
  });
  
  // Find and open the popup of the marker
  const marker = markers.find(m => m.binId === getBinId(bin));
  if (marker) {
    marker.openPopup();
  }
}

// Center the map on a specific report
function centerOnReport(report) {
  if (!map) return;
  
  const coords = getReportCoordinates(report);
  if (!coords) return;
  
  map.setView([coords.latitude, coords.longitude], 18, {
    animate: true,
    duration: 1
  });
  
  // Find and open the popup of the marker
  const marker = markers.find(m => m.reportId === getReportId(report));
  if (marker) {
    marker.openPopup();
  }
}

// Function to create a custom marker
const createCustomMarker = (type) => {
  const color = getBinColor(type);
  const iconClass = getBinIcon(type);
  
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-container" style="background-color: ${color}20">
        <i class="fas ${iconClass}" style="color: ${color}"></i>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  return customIcon;
};

// Initialize the map when the component is mounted
onMounted(() => {
  // Wait for the DOM to be fully rendered
  setTimeout(() => {
    if (!mapContainer.value) {
      console.error('Map container not found');
      return;
    }

    try {
      // Coordinate of Milan as initial point
      map = L.map(mapContainer.value, {
        center: [45.4642, 9.1900],
        zoom: 13,
        attributionControl: true
      });
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);
      
      // Force map to invalidate size after initialization
      setTimeout(() => {
        if (map) {
          map.invalidateSize();
          // Set initialization flag - this will trigger the watcher to update markers
          mapInitialized.value = true;
          console.log('Map initialized successfully');
        }
      }, 100);
      
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, 100);
})

// When the list of bins or reports changes, update the markers
watch(() => [props.bins, props.reports], () => {
  if (mapInitialized.value && map) {
    console.log('Updating markers - bins:', props.bins?.length || 0, 'reports:', props.reports?.length || 0);
    updateMarkers();
  } else {
    console.log('Map not ready yet, will update markers when initialized');
  }
}, { deep: true });

// Watch for map initialization
watch(mapInitialized, (isInitialized) => {
  if (isInitialized && map && (props.bins?.length > 0 || props.reports?.length > 0)) {
    console.log('Map just initialized, updating markers');
    updateMarkers();
  }
});

// Function to update the markers on the map
const updateMarkers = () => {
  // Check if map is initialized before proceeding
  if (!map || !mapInitialized.value) {
    console.warn('Map not yet initialized, skipping marker update');
    return;
  }

  try {
    // Remove all existing markers
    markers.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    markers = [];

    // Add markers for bins
    if (props.bins && props.bins.length) {
      props.bins.forEach(bin => {
        const coords = getBinCoordinates(bin);
        if (!coords) {
          console.warn('Bin missing valid coordinates:', bin)
          return
        }

        try {
          // Create the marker
          const marker = L.marker([coords.latitude, coords.longitude], { 
            icon: createCustomMarker(bin.type)
          })
            .addTo(map)
            .bindPopup(`
              <div class="popup-content">
                <div class="popup-header" style="color: ${getBinColor(bin.type)}">
                  <i class="fas ${getBinIcon(bin.type)}"></i>
                  <h3>${bin.type || 'Cestino'}</h3>
                  <span class="status-badge status-${bin.status || 'attivo'}">${bin.status || 'attivo'}</span>
                </div>
                <div class="popup-body">
                  <div class="popup-section">
                    <p class="popup-address">
                      <i class="fas fa-location-dot"></i>
                      ${formatBinAddress(bin)}
                    </p>
                    ${bin.lat && bin.lng ? `
                      <div class="coordinates">
                        <i class="fas fa-crosshairs"></i>
                        <small>Coordinate: ${parseFloat(bin.lat).toFixed(6)}, ${parseFloat(bin.lng).toFixed(6)}</small>
                      </div>
                    ` : ''}
                  </div>
                  
                  <div class="popup-section">
                    <div class="popup-fill-level">
                      <p><i class="fas fa-chart-simple"></i> Livello di riempimento:</p>
                      <div class="fill-bar-container">
                        <div class="fill-bar" style="
                          width: ${bin.currentFillLevel || 0}%;
                          background-color: ${getFillLevelColor(bin.currentFillLevel || 0)};
                        "></div>
                      </div>
                      <span class="fill-percentage">${bin.currentFillLevel || 0}%</span>
                    </div>
                  </div>

                  ${bin.capacity || bin.manufacturer || bin.serialNumber ? `
                    <div class="popup-section">
                      <div class="popup-details">
                        <p><i class="fas fa-cog"></i> <strong>Dettagli tecnici:</strong></p>
                        ${bin.capacity ? `
                          <div class="detail-item">
                            <i class="fas fa-flask"></i>
                            <span class="detail-label">Capacità:</span>
                            <span class="detail-value">${bin.capacity}L</span>
                          </div>
                        ` : ''}
                        ${bin.manufacturer ? `
                          <div class="detail-item">
                            <i class="fas fa-industry"></i>
                            <span class="detail-label">Produttore:</span>
                            <span class="detail-value">${bin.manufacturer}</span>
                          </div>
                        ` : ''}
                        ${bin.serialNumber ? `
                          <div class="detail-item">
                            <i class="fas fa-barcode"></i>
                            <span class="detail-label">Seriale:</span>
                            <span class="detail-value">${bin.serialNumber}</span>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  ` : ''}

                  ${bin.installationDate || bin.lastEmptied || bin.lastMaintenance ? `
                    <div class="popup-section">
                      <div class="popup-details">
                        <p><i class="fas fa-calendar"></i> <strong>Cronologia:</strong></p>
                        ${bin.installationDate ? `
                          <div class="detail-item">
                            <i class="fas fa-calendar-plus"></i>
                            <span class="detail-label">Installazione:</span>
                            <span class="detail-value">${new Date(bin.installationDate).toLocaleDateString('it-IT')}</span>
                          </div>
                        ` : ''}
                        ${bin.lastEmptied ? `
                          <div class="detail-item">
                            <i class="fas fa-trash-arrow-up"></i>
                            <span class="detail-label">Ultimo svuotamento:</span>
                            <span class="detail-value">${new Date(bin.lastEmptied).toLocaleDateString('it-IT')}</span>
                          </div>
                        ` : ''}
                        ${bin.lastMaintenance ? `
                          <div class="detail-item">
                            <i class="fas fa-tools"></i>
                            <span class="detail-label">Ultima manutenzione:</span>
                            <span class="detail-value">${new Date(bin.lastMaintenance).toLocaleDateString('it-IT')}</span>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  ` : ''}

                  <div class="popup-actions">
                    <button class="action-btn report-btn" onclick="reportIssue('${getBinId(bin)}')">
                      <i class="fas fa-exclamation-triangle"></i>
                      Segnala problema
                    </button>
                    <button class="action-btn center-btn" onclick="centerOnThisBin('${getBinId(bin)}')">
                      <i class="fas fa-crosshairs"></i>
                      Centra mappa
                    </button>
                  </div>
                </div>
              </div>
            `, {
              className: 'custom-popup'
            })

          // Add the bin ID to the marker and the click handler
          marker.binId = getBinId(bin);
          marker.on('click', () => {
            emit('bin-click', bin);
          });

          // Add the marker to the array to be able to remove it later
          markers.push(marker)
        } catch (markerError) {
          console.error('Error creating bin marker:', markerError, bin);
        }
      })
    }

    // Add markers for reports
    if (props.reports && props.reports.length) {
      props.reports.forEach(report => {
        const coords = getReportCoordinates(report);
        if (!coords) {
          console.warn('Report missing valid coordinates:', report)
          return
        }

        try {
          // Create the report marker
          const marker = L.marker([coords.latitude, coords.longitude], { 
            icon: createReportMarker(report.type, report.severity)
          })
            .addTo(map)
            .bindPopup(`
              <div class="popup-content report-popup">
                <div class="popup-header" style="color: ${getReportColor(report.severity)}">
                  <i class="fas ${getReportIcon(report.type, report.severity)}"></i>
                  <h3>Segnalazione: ${(report.reportType) || 'Altro'}</h3>
                  <span class="status-badge status-${report.status || 'segnalato'}">${report.status || 'segnalato'}</span>
                </div>
                <div class="popup-body">
                  <div class="popup-section">
                    <p class="popup-address">
                      <i class="fas fa-location-dot"></i>
                      ${formatReportAddress(report)}
                    </p>
                  </div>
                  
                  <div class="popup-section">
                    <div class="popup-details">
                      <p class="detail-item">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span class="detail-label">Gravità:</span>
                        <span class="detail-value severity-${report.severity?.toLowerCase() || 'low'}">${report.severity || 'BASSA'}</span>
                      </p>
                      
                      ${report.description ? `
                        <p class="detail-item">
                          <i class="fas fa-comment"></i>
                          <span class="detail-label">Descrizione:</span>
                          <span class="detail-value">${report.description}</span>
                        </p>
                      ` : ''}
                      
                      ${report.createdAt ? `
                        <p class="detail-item">
                          <i class="fas fa-calendar-plus"></i>
                          <span class="detail-label">Segnalato il:</span>
                          <span class="detail-value">${new Date(report.createdAt).toLocaleDateString('it-IT')}</span>
                        </p>
                      ` : ''}
                    </div>
                  </div>

                  <div class="popup-actions">
                    <button class="action-btn center-btn" onclick="centerOnThisReport('${getReportId(report)}')">
                      <i class="fas fa-crosshairs"></i>
                      Centra mappa
                    </button>
                  </div>
                </div>
              </div>
            `, {
              className: 'custom-popup report-popup-style'
            })

          // Add the report ID to the marker and the click handler
          marker.reportId = getReportId(report);
          marker.on('click', () => {
            emit('report-click', report);
          });

          // Add the marker to the array to be able to remove it later
          markers.push(marker)
        } catch (markerError) {
          console.error('Error creating report marker:', markerError, report);
        }
      })
    }

    // If there are valid markers, center the map on their bounds
    if (markers.length > 0) {
      try {
        const group = L.featureGroup(markers)
        map.fitBounds(group.getBounds().pad(0.1))
      } catch (boundsError) {
        console.warn('Error fitting bounds:', boundsError);
      }
    }
  } catch (error) {
    console.error('Error in updateMarkers:', error);
  }
}

// Expose the centerOnBin method
defineExpose({ centerOnBin, centerOnReport });

// Report modal methods
const openReportModal = (bin) => {
  selectedBinForReport.value = bin;
  showReportModal.value = true;
};

const closeReportModal = () => {
  showReportModal.value = false;
  selectedBinForReport.value = null;
  
  // Ensure modal is fully reset after animation
  setTimeout(() => {
    if (!showReportModal.value) {
      selectedBinForReport.value = null;
    }
  }, 500);
};

const handleReportSuccess = (report) => {
  console.log('Report created successfully:', report);
  // Emit an event to notify parent components
  emit('report-created', report);
  // Optionally refresh the map or show a notification
};

// Global functions for popup actions (accessible from popup HTML)
window.reportIssue = (binId) => {
  console.log('Reporting issue for bin:', binId);
  const bin = props.bins.find(b => getBinId(b) === binId);
  if (bin) {
    // Always close first, then open with fresh data
    showReportModal.value = false;
    selectedBinForReport.value = null;
    
    // Open with new bin data after brief delay
    setTimeout(() => {
      selectedBinForReport.value = bin;
      showReportModal.value = true;
    }, 100);
  } else {
    console.error('Bin not found for ID:', binId);
  }
};

window.centerOnThisBin = (binId) => {
  console.log('Centering on bin:', binId);
  const bin = props.bins.find(b => getBinId(b) === binId);
  if (bin) {
    const coords = getBinCoordinates(bin);
    if (coords) {
      centerOnBin({ latitude: coords.latitude, longitude: coords.longitude });
      // Emit bin click event to select it
      emit('bin-click', bin);
    }
  }
};

window.centerOnThisReport = (reportId) => {
  console.log('Centering on report:', reportId);
  const report = props.reports.find(r => getReportId(r) === reportId);
  if (report) {
    centerOnReport(report);
    // Emit report click event to select it
    emit('report-click', report);
  }
};
</script>

<style scoped>
/* Removed @import 'leaflet/dist/leaflet.css'; since it's now in main.js */

.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.leaflet-container {
  width: 100% !important;
  height: 100% !important;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:deep(.custom-marker) {
  background: none;
  border: none;
}

:deep(.marker-container) {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  background: white;
  border: 2px solid white;
  transition: all 0.3s ease;
}

:deep(.marker-container:hover) {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

:deep(.marker-container i) {
  font-size: 1.2rem;
}

:deep(.custom-popup) {
  min-width: 280px;
  max-width: 320px;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-popup-content) {
  margin: 0;
  width: 100% !important;
  min-width: 280px;
}

:deep(.popup-content) {
  padding: 0;
}

:deep(.popup-header) {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  position: relative;
}

:deep(.popup-header h3) {
  margin: 0;
  font-size: 1rem;
  flex: 1;
  font-weight: 600;
}

:deep(.status-badge) {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.status-attivo) {
  background: #d4edda;
  color: #155724;
}

:deep(.status-manutenzione) {
  background: #fff3cd;
  color: #856404;
}

:deep(.status-inattivo) {
  background: #f8d7da;
  color: #721c24;
}

:deep(.popup-body) {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px;
}

:deep(.popup-section) {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.popup-section:last-child) {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

:deep(.popup-address) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}

:deep(.popup-address i) {
  color: #666;
  margin-top: 3px;
  flex-shrink: 0;
  font-size: 0.85rem;
}

:deep(.coordinates) {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  color: #888;
  font-size: 0.75rem;
}

:deep(.coordinates i) {
  color: #888;
  font-size: 0.7rem;
}

:deep(.popup-fill-level) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.popup-fill-level p) {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.fill-bar-container) {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.fill-bar) {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

:deep(.fill-percentage) {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
  text-align: right;
}

:deep(.popup-details) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.popup-details p) {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

:deep(.popup-details p i) {
  color: #4CAF50;
  width: 14px;
}

:deep(.detail-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.3;
}

:deep(.detail-item i) {
  width: 14px;
  color: #6c757d;
  flex-shrink: 0;
  font-size: 0.75rem;
}

:deep(.detail-label) {
  color: #6c757d;
  font-weight: 500;
  min-width: 80px;
  font-size: 0.75rem;
}

:deep(.detail-value) {
  color: #495057;
  font-weight: 600;
  flex: 1;
  font-size: 0.8rem;
}

:deep(.popup-actions) {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

:deep(.action-btn) {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

:deep(.report-btn) {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

:deep(.report-btn:hover) {
  background: #ffeaa7;
  transform: translateY(-1px);
}

:deep(.center-btn) {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

:deep(.center-btn:hover) {
  background: #bee5eb;
  transform: translateY(-1px);
}

/* Report marker styles */
:deep(.custom-report-marker) {
  background: none !important;
  border: none !important;
}

:deep(.report-marker-container) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

:deep(.report-marker-container:hover) {
  transform: scale(1.1);
}

:deep(.report-marker-container i) {
  font-size: 16px;
}

/* Report popup styles */
:deep(.report-popup-style) {
  border-left: 4px solid #FF9800;
}

:deep(.report-popup .popup-header) {
  background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
}

/* Severity-based styles */
:deep(.severity-high) {
  color: #F44336 !important;
  font-weight: bold;
}

:deep(.severity-medium) {
  color: #FF9800 !important;
  font-weight: bold;
}

:deep(.severity-low) {
  color: #FFC107 !important;
  font-weight: bold;
}

/* Report status badges */
:deep(.status-segnalato) {
  background: #fff3cd;
  color: #856404;
}

:deep(.status-in-elaborazione) {
  background: #d1ecf1;
  color: #0c5460;
}

:deep(.status-risolto) {
  background: #d4edda;
  color: #155724;
}

:deep(.status-respinto) {
  background: #f8d7da;
  color: #721c24;
}
</style>