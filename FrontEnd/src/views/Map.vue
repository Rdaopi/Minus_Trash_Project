<template>
  <div class="map-container">
    <!-- Main layout -->
    <div class="map-layout">
      <!-- Sidebar with bin list -->
      <div class="sidebar" :class="{ 'sidebar-hidden': !showSidebar }">
        <div class="sidebar-header">
          <h2>Cestini <span class="bins-count">{{ filteredBins.length }}</span></h2>
          <button @click="toggleSidebar" class="icon-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Search and filter controls -->
        <div class="controls">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Cerca indirizzo..."
              @keyup.enter="searchLocation"
            >
            <button @click="searchLocation" :disabled="loading" class="icon-button">
              <i class="fas fa-search"></i>
            </button>
          </div>
          
          <div class="type-filter">
            <select v-model="selectedType" @change="filterBins">
              <option value="">Tutti i tipi</option>
              <option value="plastica">Plastica</option>
              <option value="carta">Carta</option>
              <option value="vetro">Vetro</option>
              <option value="indifferenziata">Indifferenziata</option>
              <option value="organico">Organico</option>
            </select>
          </div>
          
          <button @click="loadBins" class="refresh-button">
            <i class="fas fa-sync"></i> Ricarica
          </button>
        </div>
        
        <!-- Loading state -->
        <div v-if="loading" class="loading-indicator">
          <div class="spinner"></div>
          <p>Caricamento in corso...</p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
          <button @click="loadBins" class="retry-button">
            <i class="fas fa-redo"></i> Riprova
          </button>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="filteredBins.length === 0" class="empty-state">
          <p>Nessun cestino disponibile</p>
        </div>
        
        <!-- Bins list -->
        <div v-else class="bins-list">
          <div 
            v-for="bin in filteredBins" 
            :key="bin.id || bin._id" 
            class="bin-item"
            :class="{ 'selected': selectedBinId === (bin.id || bin._id) }"
            @click="selectBin(bin)"
          >
            <div class="bin-icon">
              <img :src="getBinIconUrl(bin.type)" :alt="bin.type" width="24">
            </div>
            <div class="bin-details">
              <div class="bin-title">{{ bin.type || 'Cestino' }}</div>
              <div class="bin-address">{{ getBinAddress(bin) }}</div>
              <div class="bin-fill-bar">
                <div 
                  :style="{ width: `${bin.currentFillLevel || 0}%` }" 
                  :class="getFillLevelClass(bin.currentFillLevel || 0)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Map container -->
      <div class="map-area">
        <div id="map"></div>
        
        <!-- Mobile controls -->
        <button @click="toggleSidebar" class="fab show-list-button" v-if="!showSidebar">
          <i class="fas fa-list"></i>
        </button>
        
        <!-- Legend toggle -->
        <button @click="toggleLegend" class="fab legend-button">
          <i class="fas fa-info-circle"></i>
        </button>
        
        <!-- Map legend -->
        <div class="legend" :class="{ 'legend-visible': showLegend }">
          <h4>Tipi di cestini</h4>
          <div class="legend-items">
            <div class="legend-item" v-for="(icon, type) in binIcons" :key="type">
              <img class="legend-icon" :src="icon" :alt="type">
              <span class="legend-label">{{ type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import { binsAPI } from '../services/api';

export default {
  name: 'Map',
  setup() {
    // Core state
    const map = ref(null);
    const bins = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const searchQuery = ref('');
    const selectedType = ref('');
    const showSidebar = ref(true);
    const showLegend = ref(false);
    const selectedBinId = ref(null);
    const markers = ref([]);
    
    // Computed properties
    const filteredBins = computed(() => {
      return bins.value;
    });
    
    // Bin icon mapping
    const binIcons = {
      'PLASTICA': 'https://cdn-icons-png.flaticon.com/512/1039/1039928.png',
      'CARTA': 'https://cdn-icons-png.flaticon.com/512/1039/1039833.png',
      'VETRO': 'https://cdn-icons-png.flaticon.com/512/1039/1039936.png',
      'INDIFFERENZIATO': 'https://cdn-icons-png.flaticon.com/512/3004/3004659.png',
      'ORGANICO': 'https://cdn-icons-png.flaticon.com/512/1039/1039789.png'
    };
    
    // Map initialization
    const initMap = () => {
      // Center on Trento, Italy
      map.value = L.map('map').setView([46.0667, 11.1167], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map.value);
      
      // On mobile devices, hide sidebar by default
      if (window.innerWidth <= 768) {
        showSidebar.value = false;
      }
    };
    
    // Load bins from API
    const loadBins = async () => {
      if (loading.value) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        const data = await binsAPI.getAllBins();
        
        if (Array.isArray(data) && data.length > 0) {
          bins.value = data;
        } else if (data && data.bins && Array.isArray(data.bins)) {
          bins.value = data.bins;
        } else {
          throw new Error('Formato dati non valido');
        }
        
        updateMapMarkers();
      } catch (err) {
        console.error('Error loading bins:', err);
        error.value = 'Impossibile caricare i cestini. Riprova più tardi.';
      } finally {
        loading.value = false;
      }
    };
    
    // Filter bins by type
    const filterBins = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        if (!selectedType.value) {
          return await loadBins();
        }
        
        const data = await binsAPI.getBinsByType(selectedType.value);
        bins.value = Array.isArray(data) ? data : data.bins || [];
        updateMapMarkers();
      } catch (err) {
        console.error('Error filtering bins:', err);
        error.value = 'Impossibile filtrare i cestini. Riprova più tardi.';
      } finally {
        loading.value = false;
      }
    };
    
    // Search by location
    const searchLocation = async () => {
      if (!searchQuery.value) return;
      
      loading.value = true;
      error.value = null;
      
      try {
        // For demo purposes, search near Trento
        const lat = 46.0667;
        const lng = 11.1167;
        
        const data = await binsAPI.getNearbyBins(lat, lng, 1000);
        bins.value = Array.isArray(data) ? data : data.bins || [];
        
        map.value.setView([lat, lng], 15);
        updateMapMarkers();
      } catch (err) {
        console.error('Error searching location:', err);
        error.value = 'Impossibile cercare in questa posizione. Riprova più tardi.';
      } finally {
        loading.value = false;
      }
    };
    
    // Update map markers
    const updateMapMarkers = () => {
      // Clear existing markers
      markers.value.forEach(marker => marker.remove());
      markers.value = [];
      
      // Add new markers
      bins.value.forEach(bin => {
        try {
          // Extract coordinates
          let lat, lng;
          
          if (bin.latitude !== undefined && bin.longitude !== undefined) {
            lat = Number(bin.latitude);
            lng = Number(bin.longitude);
          } else if (bin.location && bin.location.coordinates && bin.location.coordinates.length >= 2) {
            lng = Number(bin.location.coordinates[0]);
            lat = Number(bin.location.coordinates[1]);
          } else {
            return; // Skip if no valid coordinates
          }
          
          // Skip invalid coordinates
          if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
            return;
          }
          
          // Create marker with custom icon
          const iconUrl = getBinIconUrl(bin.type);
          const customIcon = L.icon({
            iconUrl,
            iconSize: [25, 25],
            iconAnchor: [12, 12],
            popupAnchor: [0, -10]
          });
          
          const marker = L.marker([lat, lng], { icon: customIcon })
            .bindPopup(createPopupContent(bin))
            .addTo(map.value);
          
          // Add click handler to select bin
          marker.on('click', () => {
            selectedBinId.value = bin.id || bin._id;
            
            // On mobile, open sidebar when marker is clicked
            if (window.innerWidth <= 768) {
              showSidebar.value = true;
            }
          });
          
          markers.value.push(marker);
        } catch (err) {
          console.error('Error creating marker:', err);
        }
      });
      
      // Fit map to markers if any
      if (markers.value.length > 0) {
        const group = L.featureGroup(markers.value);
        map.value.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    };
    
    // Create popup content for markers
    const createPopupContent = (bin) => {
      return `
        <div class="popup-content">
          <h3>${getBinAddress(bin)}</h3>
          <p><strong>Tipo:</strong> ${bin.type || 'N/A'}</p>
          <p><strong>Capacità:</strong> ${bin.capacity || 0}%</p>
          <p><strong>Livello attuale:</strong> ${bin.currentFillLevel || 0}%</p>
          <p><strong>Stato:</strong> ${getBinStatus(bin)}</p>
        </div>
      `;
    };
    
    // Select a bin from the list
    const selectBin = (bin) => {
      selectedBinId.value = bin.id || bin._id;
      
      // Extract coordinates
      let lat, lng;
      
      if (bin.latitude !== undefined && bin.longitude !== undefined) {
        lat = Number(bin.latitude);
        lng = Number(bin.longitude);
      } else if (bin.location && bin.location.coordinates && bin.location.coordinates.length >= 2) {
        lng = Number(bin.location.coordinates[0]);
        lat = Number(bin.location.coordinates[1]);
      } else {
        return; // Skip if no valid coordinates
      }
      
      // Center map on selected bin
      map.value.setView([lat, lng], 17);
      
      // Find and open the corresponding marker popup
      markers.value.forEach(marker => {
        const pos = marker.getLatLng();
        if (Math.abs(pos.lat - lat) < 0.0001 && Math.abs(pos.lng - lng) < 0.0001) {
          marker.openPopup();
        }
      });
      
      // On mobile, close sidebar after selection
      if (window.innerWidth <= 768) {
        showSidebar.value = false;
      }
    };
    
    // Toggle sidebar visibility
    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value;
    };
    
    // Toggle legend visibility
    const toggleLegend = () => {
      showLegend.value = !showLegend.value;
    };
    
    // Helper functions
    const getBinIconUrl = (type) => {
      if (!type) return binIcons.INDIFFERENZIATO;
      
      const normalizedType = type.toUpperCase();
      return binIcons[normalizedType] || binIcons.INDIFFERENZIATO;
    };
    
    const getBinAddress = (bin) => {
      if (bin.address) return bin.address;
      
      if (bin.location && bin.location.address) {
        const addr = bin.location.address;
        return [addr.street, addr.city, addr.postalCode].filter(Boolean).join(', ');
      }
      
      return 'Indirizzo non disponibile';
    };
    
    const getBinStatus = (bin) => {
      if (!bin.status) return 'Non specificato';
      
      const stati = {
        'attivo': 'Attivo',
        'manutenzione': 'In manutenzione',
        'inattivo': 'Inattivo',
        'pieno': 'Pieno',
        'available': 'Disponibile',
        'maintenance': 'In manutenzione',
        'inactive': 'Inattivo',
        'full': 'Pieno'
      };
      
      return stati[bin.status.toLowerCase()] || bin.status;
    };
    
    const getFillLevelClass = (level) => {
      if (level > 80) return 'level-high';
      if (level > 50) return 'level-medium';
      return 'level-low';
    };
    
    // Handle window resize
    const handleResize = () => {
      if (map.value) {
        map.value.invalidateSize();
      }
    };
    
    onMounted(() => {
      initMap();
      loadBins();
      window.addEventListener('resize', handleResize);
    });
    
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });
    
    return {
      bins,
      filteredBins,
      loading,
      error,
      searchQuery,
      selectedType,
      showSidebar,
      showLegend,
      selectedBinId,
      binIcons,
      loadBins,
      filterBins,
      searchLocation,
      selectBin,
      toggleSidebar,
      toggleLegend,
      getBinIconUrl,
      getBinAddress,
      getFillLevelClass
    };
  }
}
</script>

<style scoped>
/* Main container */
.map-container {
  height: calc(100vh - 80px);
  width: 100%;
}

/* Layout */
.map-layout {
  display: flex;
  height: 100%;
  position: relative;
}

/* Sidebar */
.sidebar {
  width: 300px;
  height: 100%;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  border-radius: 2.5rem 0 0 2.5rem;
}

.sidebar-hidden {
  transform: translateX(-100%);
}

.sidebar-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.bins-count {
  background: #4CAF50;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

/* Controls */
.controls {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid #eee;
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-box input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.type-filter select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.refresh-button {
  padding: 8px;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.refresh-button:hover {
  background: #e0e0e0;
}

/* Icons */
.icon-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
}

.icon-button:hover {
  background: #f5f5f5;
}

/* Bins list */
.bins-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bin-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 2.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.bin-item:hover {
  background: #e9e9e9;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bin-item.selected {
  border-left-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.bin-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 50%;
}

.bin-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bin-title {
  font-weight: bold;
}

.bin-address {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bin-fill-bar {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.bin-fill-bar > div {
  height: 100%;
  transition: width 0.3s ease;
}

.level-low {
  background: #4CAF50;
}

.level-medium {
  background: #FFC107;
}

.level-high {
  background: #F44336;
}

/* Map area */
.map-area {
  flex: 1;
  position: relative;
}

#map {
  height: 100%;
  width: 100%;
  background: #f5f5f5;
  z-index: 1;
}

/* Loading indicator */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(76, 175, 80, 0.2);
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spinner 1s linear infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

/* Error and empty states */
.error-message, .empty-state {
  padding: 16px;
  text-align: center;
}

.error-message {
  background: #FFEBEE;
  color: #C62828;
  border-radius: 8px;
}

.retry-button {
  margin-top: 12px;
  background: none;
  border: 1px solid #C62828;
  color: #C62828;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background: rgba(198, 40, 40, 0.1);
}

/* Floating action buttons */
.fab {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 8rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.show-list-button {
  top: 16px;
  left: 16px;
}

.legend-button {
  bottom: 16px;
  right: 16px;
}

/* Legend */
.legend {
  position: absolute;
  bottom: 80px;
  right: 16px;
  background: white;
  border-radius: 2.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 16px;
  z-index: 1000;
  max-width: 200px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}

.legend-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.legend h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  text-align: center;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-icon {
  width: 16px;
  height: 16px;
}

.legend-label {
  font-size: 12px;
}

/* Popup styling */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 2.5rem;
  overflow: hidden;
}

:deep(.leaflet-popup-content) {
  margin: 12px;
  min-width: 180px;
}

.popup-content h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #4CAF50;
}

.popup-content p {
  margin: 4px 0;
  font-size: 12px;
}

/* Media queries for responsive design */
@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 280px;
    z-index: 2000;
  }
  
  .map-area {
    width: 100%;
  }
}
</style>