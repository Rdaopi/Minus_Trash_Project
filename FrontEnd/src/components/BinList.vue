<script setup>
import { defineProps, onMounted, watch, ref, computed } from 'vue';

const props = defineProps({
  bins: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedBinId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['select-bin', 'bins-filtered']);

// Filtri e ricerca
const searchQuery = ref('');
const selectedType = ref('');
const selectedStatus = ref('');

// Functions to check filters from outside
const setSearchQuery = (query) => {
  searchQuery.value = query;
};

const setTypeFilter = (type) => {
  selectedType.value = type;
};

const setStatusFilter = (status) => {
  selectedStatus.value = status;
};

const clearAllFilters = () => {
  searchQuery.value = '';
  selectedType.value = '';
  selectedStatus.value = '';
};

const getFilterState = () => {
  return {
    searchQuery: searchQuery.value,
    selectedType: selectedType.value,
    selectedStatus: selectedStatus.value,
    hasActiveFilters: !!(searchQuery.value || selectedType.value || selectedStatus.value),
    totalBins: props.bins.length,
    filteredCount: filteredBins.value.length,
    hiddenCount: props.bins.length - filteredBins.value.length
  };
};

// Funzione per ottenere statistiche sui tipi di cestini
const getTypeStats = () => {
  const stats = {};
  props.bins.forEach(bin => {
    const type = bin.type || 'UNKNOWN';
    stats[type] = (stats[type] || 0) + 1;
  });
  return stats;
};

// Funzione per ottenere statistiche sugli status
const getStatusStats = () => {
  const stats = {};
  props.bins.forEach(bin => {
    const status = bin.status || 'attivo';
    stats[status] = (stats[status] || 0) + 1;
  });
  return stats;
};

// Computed per i cestini filtrati
const filteredBins = computed(() => {
  let filtered = [...props.bins];
  
  // Debug: log dei dati per capire la struttura (solo se necessario)
  if (props.bins.length > 0 && process.env.NODE_ENV === 'development') {
    console.log('Bin data for filtering:', props.bins.map(bin => ({ 
      id: bin.id || bin._id, 
      type: bin.type, 
      status: bin.status 
    })));
    if (selectedType.value) {
      console.log('Type filter active:', selectedType.value);
    }
    if (selectedStatus.value) {
      console.log('Status filter active:', selectedStatus.value);
    }
  }
  
  // Applica filtro per tipo
  if (selectedType.value) {
    filtered = filtered.filter(bin => {
      const binType = bin.type?.toUpperCase();
      const selectedTypeUpper = selectedType.value.toUpperCase();
      // Gestisce anche il caso INDIFFERENZIATA vs INDIFFERENZIATO
      return binType === selectedTypeUpper || 
             (binType === 'INDIFFERENZIATO')
    });
  }
  
  // Applica filtro per status
  if (selectedStatus.value) {
    filtered = filtered.filter(bin => {
      const binStatus = bin.status?.toLowerCase() || 'attivo';
      const selectedStatusLower = selectedStatus.value.toLowerCase();
             if (process.env.NODE_ENV === 'development') {
         console.log(`Comparing bin status: "${binStatus}" with selected: "${selectedStatusLower}"`);
       }
       return binStatus === selectedStatusLower;
    });
  }
  
  // Applica filtro di ricerca
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(bin => {
      const address = formatAddress(bin).toLowerCase();
      const type = bin.type?.toLowerCase() || '';
      const serialNumber = bin.serialNumber?.toLowerCase() || '';
      return address.includes(query) || type.includes(query) || serialNumber.includes(query);
    });
  }
  
  console.log(`Filtered ${filtered.length} bins from ${props.bins.length} total`);
  return filtered;
});

// Watch for emitting filtered bins when they change
watch(filteredBins, (newFilteredBins) => {
  emit('bins-filtered', newFilteredBins);
}, { immediate: true });

const getFillLevelClass = (level) => {
  if (level >= 80) return 'level-high';
  if (level >= 50) return 'level-medium';
  return 'level-low';
};

const getBinIcon = (type) => {
  const typeMap = {
    'PLASTICA': 'fa-bottle-water',
    'CARTA': 'fa-newspaper',
    'VETRO': 'fa-wine-bottle',
    'INDIFFERENZIATO': 'fa-trash',  
    'ORGANICO': 'fa-apple-whole',
    'RAEE': 'fa-laptop',
    'default': 'fa-trash-can'
  };
  
  return typeMap[type?.toUpperCase()] || typeMap.default;
};

const getBinColor = (type) => {
  const colorMap = {
    'PLASTICA': '#ffeb3b',
    'CARTA': '#2196f3',
    'VETRO': '#4caf50',
    'INDIFFERENZIATO': '#9e9e9e',
    'ORGANICO': '#795548',
    'RAEE': '#f44336',
    'default': '#9e9e9e'
  };
  
  return colorMap[type?.toUpperCase()] || colorMap.default;
};

// Format the address for display
function formatAddress(bin) {
  if (!bin) return 'Indirizzo non disponibile';
  
  // Debug: log the bin structure to understand the data format
  console.log('Bin data structure:', bin);
  
  // If bin.address exists directly (simple format)
  if (bin.address && typeof bin.address === 'string') {
    return bin.address;
  }
  
  // If the address is in bin.location.address (structured format)
  if (bin.location && bin.location.address) {
    // If it's a string
    if (typeof bin.location.address === 'string') {
      return bin.location.address;
    }
    
    // If it's an object with structured fields
    if (typeof bin.location.address === 'object' && bin.location.address !== null) {
      const address = bin.location.address;
      const parts = [];
      
      // Try different possible field names
      if (address.street) parts.push(address.street);
      if (address.streetNumber) parts.push(address.streetNumber);
      if (address.city) parts.push(address.city);
      if (address.postalCode) parts.push(address.postalCode);
      if (address.cap) parts.push(address.cap);
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
      
      // If no structured fields, try to convert object to readable string
      const addressString = Object.values(address).filter(val => val && typeof val === 'string').join(', ');
      if (addressString) return addressString;
    }
  }
  // If bin.location exists but no address, try coordinates as fallback
  if (bin.location && (bin.location.coordinates || (bin.location.lat && bin.location.lng))) {
    const lat = bin.location.coordinates?.[1] || bin.location.lat;
    const lng = bin.location.coordinates?.[0] || bin.location.lng;
    if (lat && lng) {
      return `Coordinate: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
  return 'Indirizzo non disponibile';
}

// Log quando i cestini cambiano
watch(() => props.bins, (newBins) => {
  console.log('BinList received new bins:', newBins);
}, { deep: true });

// Log iniziale dei cestini
onMounted(() => {
  console.log('BinList initial bins:', props.bins);
});

// Expose methods for external use
defineExpose({
  setSearchQuery,
  setTypeFilter,
  setStatusFilter,
  clearAllFilters,
  getFilterState,
  getTypeStats,
  getStatusStats,
  filteredBins
});
</script>

<template>
  <div class="bins-list-container">
    <!-- Header con conteggio -->
    <div class="list-header">
      <h3>Cestini <span class="bins-count">{{ filteredBins.length }}</span></h3>
      <div class="filter-status" v-if="getFilterState().hasActiveFilters">
        <span class="filter-indicator">
          <i class="fas fa-filter"></i>
          Filtri attivi
        </span>
        <button @click="clearAllFilters" class="clear-filters-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
    
    <!-- Controlli di ricerca e filtri -->
    <div class="controls">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Cerca indirizzo..."
        >
      </div>
      
      <div class="filters-row">
        <div class="type-filter">
          <select v-model="selectedType">
            <option value="">Tutti i tipi</option>
            <option value="PLASTICA">Plastica</option>
            <option value="CARTA">Carta</option>
            <option value="VETRO">Vetro</option>
            <option value="INDIFFERENZIATO">Indifferenziato</option>
            <option value="ORGANICO">Organico</option>
            <option value="RAEE">RAEE</option>
          </select>
        </div>
        
        <div class="status-filter">
          <select v-model="selectedStatus">
            <option value="">Tutti gli stati</option>
            <option value="attivo">Attivo</option>
            <option value="manutenzione">Manutenzione</option>
            <option value="inattivo">Inattivo</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Lista cestini -->
    <div class="bins-list">
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>Caricamento in corso...</p>
      </div>
      
      <div v-else-if="filteredBins.length === 0" class="empty-state">
        <p v-if="searchQuery || selectedType || selectedStatus">
          Nessun cestino trovato con i filtri applicati
        </p>
        <p v-else>Nessun cestino disponibile</p>
      </div>
      
      <div v-else class="bins-container">
        <div 
          v-for="bin in filteredBins" 
          :key="bin.id || bin._id"
          class="bin-item"
          :class="{ 'selected': selectedBinId === (bin.id || bin._id) }"
          @click="$emit('select-bin', bin)"
        >
          <div class="bin-icon" :style="{ backgroundColor: getBinColor(bin.type) + '20' }">
            <i class="fas" :class="getBinIcon(bin.type)" :style="{ color: getBinColor(bin.type) }"></i>
          </div>
          <div class="bin-details">
            <div class="bin-header">
              <div class="bin-title">{{ bin.type || 'Cestino' }}</div>
              <span class="status-badge" :class="`status-${bin.status || 'attivo'}`">
                {{ bin.status || 'attivo' }}
              </span>
            </div>
            <div class="bin-address">{{ formatAddress(bin) }}</div>
            <div class="bin-fill-info">
              <span class="fill-text">Riempimento: {{ bin.currentFillLevel || 0 }}%</span>
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
    </div>
  </div>
</template>

<style scoped>
.bins-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  overflow: hidden;
}

/* Header */
.list-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.list-header h3 {
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

.filter-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.filter-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 12px;
}

.filter-indicator i {
  color: #4CAF50;
}

.clear-filters-btn {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s ease;
}

.clear-filters-btn:hover {
  background: #cc0000;
  transform: scale(1.1);
}

/* Controlli */
.controls {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.search-box input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.filters-row {
  display: flex;
  gap: 8px;
}

.type-filter,
.status-filter {
  flex: 1;
}

.type-filter select,
.status-filter select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

/* Lista scrollabile */
.bins-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  min-height: 0;
}

.bins-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
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
  align-items: center;
  flex-shrink: 0;
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
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.bin-icon i {
  font-size: 1.2rem;
}

.bin-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.bin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.bin-title {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.status-attivo {
  background: #d4edda;
  color: #155724;
}

.status-manutenzione {
  background: #fff3cd;
  color: #856404;
}

.status-inattivo {
  background: #f8d7da;
  color: #721c24;
}

.bin-address {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bin-fill-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fill-text {
  font-size: 11px;
  color: #888;
}

.bin-fill-bar {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
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

/* Loading state */
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

/* Empty state */
.empty-state {
  padding: 16px;
  text-align: center;
  color: #666;
}

/* Scrollbar personalizzata per webkit browsers */
.bins-list::-webkit-scrollbar {
  width: 6px;
}

.bins-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.bins-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.bins-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive */
@media (max-width: 480px) {
  .filters-row {
    flex-direction: column;
  }
  
  .bin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .bins-container {
    padding: 12px;
  }
  
  .bin-item {
    padding: 10px;
  }
}
</style> 