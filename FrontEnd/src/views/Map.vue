<template>
  <div class="map-container">
    <!-- Main layout -->
    <div class="map-layout">
      <!-- Sidebar with bin list -->
      <div class="sidebar" :class="{ 'sidebar-hidden': !showSidebar }">
        <div class="sidebar-header">
          <h2>Cestini <span class="bins-count">{{ displayedBins.length > 0 ? displayedBins.length : bins.length }}</span></h2>
          <div class="header-controls">
            <button @click="loadBins" class="icon-button refresh-button" :disabled="loading">
              <i class="fas fa-redo" :class="{ 'fa-spin': loading }"></i>
            </button>
            <button @click="toggleSidebar" class="icon-button">
              <i class="fas fa-times"></i>
            </button>
          </div>
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
        
        <!-- Success message -->
        <div v-if="successMessage" class="success-message">
          <i class="fas fa-check-circle"></i>
          <span>{{ successMessage }}</span>
          <button @click="successMessage = null" class="close-message">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="bins.length === 0" class="empty-state">
          <p>Nessun cestino disponibile</p>
        </div>
        
        <!-- Bins list -->
        <div v-else class="bins-container">
          <!-- Show bin details if a bin is selected -->
          <div v-if="selectedBinDetails" class="bin-details-panel">
            <BinDetails 
              :bin="selectedBinDetails"
              :loading="loadingBinDetails"
              :error="binDetailsError"
              @close="clearSelectedBin"
              @retry="retryLoad"
              @center-on-map="centerOnSelectedBin"
              @report-created="handleReportCreatedFromBin"
            />
          </div>
          
          <!-- Show bin list if no bin is selected -->
          <div v-else>
            <BinList 
              :bins="bins"
              :loading="loading"
              :selected-bin-id="selectedBinId"
              :hide-header="true"
              @select-bin="selectBin"
              @bins-filtered="handleBinsFiltered"
              ref="binListRef"
            />
          </div>
        </div>
      </div>
      
      <!-- Map area using MapComponent -->
      <div class="map-area">
        <MapComponent 
          :bins="displayedBins.length > 0 ? displayedBins : bins" 
          ref="mapRef"
          @report-created="handleReportCreated"
        />
        
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
            <div class="legend-item" v-for="type in ['PLASTICA', 'CARTA', 'VETRO', 'ORGANICO', 'INDIFFERENZIAT', 'RAEE']" :key="type">
              <span class="legend-label">{{ type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { binsAPI } from '../services/api';
import MapComponent from '../components/MapComponent.vue';
import BinList from '../components/BinList.vue';
import BinDetails from '../components/BinDetails.vue';
import { useBinDetails } from '../composables/useBinDetails';
import { useMessages } from '../composables/useMessages';

//Core state
const bins = ref([]);
const loading = ref(false);
const error = ref(null);
const showSidebar = ref(true);
const showLegend = ref(false);
const mapRef = ref(null);
const binListRef = ref(null);

// Use composables
const {
  selectedBinId,
  selectedBinDetails,
  loading: loadingBinDetails,
  error: binDetailsError,
  hasSelectedBin,
  loadBinDetails,
  clearSelection,
  retryLoad
} = useBinDetails();

const { successMessage, handleReportSuccess } = useMessages();

// Stato per i cestini filtrati (gestito da BinList)
const displayedBins = ref([]);

//Load bins from API
const loadBins = async () => {
  if (loading.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const data = await binsAPI.getAllBins();
    console.log('Data received from server:', data);
    
    if (Array.isArray(data) && data.length > 0) {
      bins.value = data;
    } else if (data && data.bins && Array.isArray(data.bins)) {
      bins.value = data.bins;
    } else {
      throw new Error('Invalid data format');
    }
  } catch (err) {
    console.error('Error loading bins:', err);
    error.value = 'Unable to load bins. Please try again later.';
  } finally {
    loading.value = false;
  }
};

//UI handlers
const toggleSidebar = () => showSidebar.value = !showSidebar.value;
const toggleLegend = () => showLegend.value = !showLegend.value;

const selectBin = async (bin) => {
  const binId = bin.id || bin._id;
  
  // Carica i dettagli del cestino selezionato
  await loadBinDetails(binId);
  
  // Centra la mappa sul cestino selezionato
  if (mapRef.value) {
    const latitude = bin.lat || bin.latitude || (bin.location?.coordinates?.[1]);
    const longitude = bin.lng || bin.longitude || (bin.location?.coordinates?.[0]);
    
    if (latitude && longitude) {
      console.log('Centering map on bin:', { latitude, longitude });
      mapRef.value.centerOnBin({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
    }
  }
};

// Handler per ricevere i cestini filtrati dalla BinList
const handleBinsFiltered = (filtered) => {
  displayedBins.value = filtered;
  console.log('Filtered bins received:', filtered.length);
};

// Metodi per controllare i filtri dall'esterno (opzionale)
const setFilter = (type, value) => {
  if (!binListRef.value) return;
  
  switch(type) {
    case 'search':
      binListRef.value.setSearchQuery(value);
      break;
    case 'type':
      binListRef.value.setTypeFilter(value);
      break;
    case 'status':
      binListRef.value.setStatusFilter(value);
      break;
  }
};

const clearFilters = () => {
  if (binListRef.value) {
    binListRef.value.clearAllFilters();
  }
};

const getFilterState = () => {
  return binListRef.value ? binListRef.value.getFilterState() : null;
};

const clearSelectedBin = () => {
  clearSelection();
  // Dont close the sidebar, just go back to the list
};

const centerOnSelectedBin = (bin) => {
  if (mapRef.value) {
    const latitude = bin.lat || bin.latitude || (bin.location?.coordinates?.[1]);
    const longitude = bin.lng || bin.longitude || (bin.location?.coordinates?.[0]);
    
    if (latitude && longitude) {
      console.log('Centering map on bin:', { latitude, longitude });
      mapRef.value.centerOnBin({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
    }
  }
};

const handleReportCreated = (report) => {
  console.log('Report created successfully:', report);
  
  // Show success message
  handleReportSuccess('Segnalazione inviata con successo! Il problema segnalato verrà preso in carico dal nostro team.');
};

const handleReportCreatedFromBin = (report) => {
  console.log('Report created from bin details:', report);
  
  // Show success message
  handleReportSuccess('Segnalazione inviata con successo! Il problema segnalato verrà preso in carico dal nostro team.');
};

//Load bins when component mounts
onMounted(loadBins);

// Expose methods for external control (useful for future integrations)
defineExpose({
  loadBins,
  setFilter,
  clearFilters,
  getFilterState,
  selectBin,
  toggleSidebar,
  toggleLegend
});
</script>

<style scoped>
/* Main container */
.map-container {
  height: calc(100vh - 60px);
  width: 100%;
  position: relative;
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

.header-controls {
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
  border-bottom: 1px solid #eee;
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
  transition: all 0.2s ease;
}

.icon-button:hover:not(:disabled) {
  background: #f5f5f5;
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-button {
  color: #4CAF50;
}

.refresh-button:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.1);
}

/* Map area */
.map-area {
  flex: 1;
  position: relative;
  height: 100%;
  min-height: 0;
}

.map-area :deep(.leaflet-container) {
  height: 100% !important;
  width: 100% !important;
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
  .map-container {
    height: calc(100vh - 60px);
  }
  
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
    height: 100%;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 100%;
  }
  
  .map-container {
    height: calc(100vh - 50px);
  }
}

/* Sidebar */
.bins-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Assicuriamoci che BinList sia scrollabile */
.bins-container :deep(.bins-list-container) {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bins-container :deep(.bins-list) {
  flex: 1;
  overflow-y: scroll !important;
  overflow-x: hidden;
  min-height: 0;
  height: calc(100vh - 250px) !important; /* Ripristino altezza precedente */
  max-height: calc(100vh - 250px) !important;
}

/* Bin details panel */
.bin-details-panel {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Success message */
.success-message {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #E8F5E9;
  color: #4CAF50;
  padding: 8px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-message {
  background: none;
  border: none;
  cursor: pointer;
  color: #4CAF50;
}
</style>