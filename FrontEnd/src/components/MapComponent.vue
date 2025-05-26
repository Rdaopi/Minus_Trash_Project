<template>
  <div ref="mapContainer" style="height: 500px; width: 100%"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  bins: {
    type: Array,
    required: true,
    default: () => []
  },
  selectedBinId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['bin-click'])

const mapContainer = ref(null)
let map = null // reference to the Leaflet map
let markers = [] // array to keep track of markers

const getBinIcon = (type) => {
  const typeMap = {
    'PLASTICA': 'fa-bottle-water',
    'CARTA': 'fa-newspaper',
    'VETRO': 'fa-wine-bottle',
    'INDIFFERENZIATA': 'fa-solid fa-trash',
    'ORGANICO': 'fa-apple-whole',
    'RAEE': 'fa-laptop',
    'default': 'fa-trash-can'
  };
  
  return typeMap[type?.toUpperCase()] || typeMap.default;
};

const getBinColor = (type) => {
  const colorMap = {
    'PLASTICA': '#ffeb3b',  // Yellow
    'CARTA': '#2196f3',     // Blue
    'VETRO': '#4caf50',     // Green
    'INDIFFERENZIATA': '#9e9e9e', // Gray
    'ORGANICO': '#795548',  // Brown
    'RAEE': '#f44336',      // Red
    'default': '#9e9e9e'    // Gray as fallback
  };
  
  return colorMap[type?.toUpperCase()] || colorMap.default;
};

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

// Function to get the color based on the fill level
const getFillLevelColor = (level) => {
  if (level >= 80) return '#F44336'; // Red
  if (level >= 50) return '#FFC107'; // Yellow
  return '#4CAF50'; // Green
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
  const marker = markers.find(m => m.binId === (bin.id || bin._id));
  if (marker) {
    marker.openPopup();
  }
}

// Format the address for the popup
function formatAddress(bin) {
  const parts = [];
  if (bin.street) parts.push(bin.street);
  if (bin.streetNumber) parts.push(bin.streetNumber);
  if (bin.city) parts.push(bin.city);
  if (bin.cap) parts.push(bin.cap);
  
  return parts.length > 0 ? parts.join(', ') : (bin.address || 'Indirizzo non disponibile');
}

// Initialize the map when the component is mounted
onMounted(() => {
  // Coordinate of Milan as initial point
  map = L.map(mapContainer.value).setView([45.4642, 9.1900], 13)
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)
  
  // If there are bins, show them
  if (props.bins && props.bins.length) {
    updateMarkers()
  }
})

// When the list of bins changes, update the markers
watch(() => props.bins, () => {
  updateMarkers()
}, { deep: true })

// Function to update the markers on the map
const updateMarkers = () => {
  // Remove all existing markers
  markers.forEach(marker => marker.remove())
  markers = []

  // If there are no bins, exit
  if (!props.bins || !props.bins.length) return

  // Add a marker for each bin
  props.bins.forEach(bin => {
    // Check that the bin has valid coordinates
    const lat = bin.lat || (bin.location?.coordinates?.[1])
    const lng = bin.lng || (bin.location?.coordinates?.[0])
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.warn('Bin missing valid coordinates:', bin)
      return
    }

    // Create the marker
    const marker = L.marker([lat, lng], { 
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
                ${formatAddress(bin)}
              </p>
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

            <div class="popup-section">
              <div class="popup-details">
                ${bin.serialNumber ? `
                  <p class="detail-item">
                    <i class="fas fa-barcode"></i>
                    <span class="detail-label">Serial:</span>
                    <span class="detail-value">${bin.serialNumber}</span>
                  </p>
                ` : ''}
                
                ${bin.manufacturer ? `
                  <p class="detail-item">
                    <i class="fas fa-industry"></i>
                    <span class="detail-label">Produttore:</span>
                    <span class="detail-value">${bin.manufacturer}</span>
                  </p>
                ` : ''}
                
                ${bin.capacity ? `
                  <p class="detail-item">
                    <i class="fas fa-weight-hanging"></i>
                    <span class="detail-label">Capacità:</span>
                    <span class="detail-value">${bin.capacity}L</span>
                  </p>
                ` : ''}
                
                ${bin.installationDate ? `
                  <p class="detail-item">
                    <i class="fas fa-calendar-plus"></i>
                    <span class="detail-label">Installato:</span>
                    <span class="detail-value">${new Date(bin.installationDate).toLocaleDateString('it-IT')}</span>
                  </p>
                ` : ''}
                
                ${bin.lastEmptied ? `
                  <p class="detail-item">
                    <i class="fas fa-calendar-check"></i>
                    <span class="detail-label">Ultimo svuotamento:</span>
                    <span class="detail-value">${new Date(bin.lastEmptied).toLocaleDateString('it-IT')}</span>
                  </p>
                ` : ''}
              </div>
            </div>

            <div class="popup-actions">
              <button class="action-btn report-btn" onclick="reportIssue('${bin.id || bin._id}')">
                <i class="fas fa-exclamation-triangle"></i>
                Segnala problema
              </button>
              <button class="action-btn center-btn" onclick="centerOnThisBin('${bin.id || bin._id}')">
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
    marker.binId = bin.id || bin._id;
    marker.on('click', () => {
      emit('bin-click', bin);
    });

    // Add the marker to the array to be able to remove it later
    markers.push(marker)
  })

  // If there are valid markers, center the map on their bounds
  if (markers.length > 0) {
    const group = L.featureGroup(markers)
    map.fitBounds(group.getBounds().pad(0.1))
  }
}

// Expose the centerOnBin method
defineExpose({ centerOnBin });

// Global functions for popup actions (accessible from popup HTML)
window.reportIssue = (binId) => {
  console.log('Reporting issue for bin:', binId);
  // Here you can implement the issue reporting logic
  alert(`Segnalazione problema per cestino ${binId} - Funzionalità da implementare`);
};

window.centerOnThisBin = (binId) => {
  console.log('Centering on bin:', binId);
  const bin = props.bins.find(b => (b.id || b._id) === binId);
  if (bin) {
    const lat = bin.lat || (bin.location?.coordinates?.[1]);
    const lng = bin.lng || (bin.location?.coordinates?.[0]);
    if (lat && lng) {
      centerOnBin({ latitude: lat, longitude: lng });
      // Emit bin click event to select it
      emit('bin-click', bin);
    }
  }
};
</script>

<style scoped>
@import 'leaflet/dist/leaflet.css';

.leaflet-container {
  width: 100%;
  height: 100%;
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
  max-width: 350px;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 15px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-popup-content) {
  margin: 0;
  width: 100% !important;
}

:deep(.popup-content) {
  padding: 0;
}

:deep(.popup-header) {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  position: relative;
}

:deep(.popup-header h3) {
  margin: 0;
  font-size: 1.1rem;
  flex: 1;
}

:deep(.status-badge) {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
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
  padding: 15px;
}

:deep(.popup-section) {
  margin-bottom: 15px;
  padding-bottom: 12px;
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
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

:deep(.popup-address i) {
  color: #666;
  margin-top: 3px;
  flex-shrink: 0;
}

:deep(.popup-fill-level) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.popup-fill-level p) {
  margin: 0;
  font-size: 0.9rem;
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
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  text-align: right;
}

:deep(.popup-details) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.detail-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.3;
}

:deep(.detail-item i) {
  width: 14px;
  color: #6c757d;
  flex-shrink: 0;
}

:deep(.detail-label) {
  color: #6c757d;
  font-weight: 500;
  min-width: 80px;
}

:deep(.detail-value) {
  color: #495057;
  font-weight: 600;
  flex: 1;
}

:deep(.popup-actions) {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

:deep(.action-btn) {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
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
</style>