//Reusable component to display a list of bins
<script setup>
import { defineProps, onMounted, watch } from 'vue';

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

const emit = defineEmits(['select-bin']);

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
    'INDIFFERENZIATA': 'fa-trash',
    'ORGANICO': 'fa-apple-whole',
    'RAEE': 'fa-laptop',
    'default': 'fa-trash-can'
  };
  
  return typeMap[type?.toUpperCase()] || typeMap.default;
};

const getBinColor = (type) => {
  const colorMap = {
    'PLASTICA': '#ffeb3b',  // Giallo
    'CARTA': '#2196f3',     // Blu
    'VETRO': '#4caf50',     // Verde
    'INDIFFERENZIATA': '#9e9e9e', // Grigio
    'ORGANICO': '#795548',  // Marrone
    'RAEE': '#f44336',      // Rosso
    'default': '#9e9e9e'    // Grigio come fallback
  };
  
  return colorMap[type?.toUpperCase()] || colorMap.default;
};

// Formatta l'indirizzo per la visualizzazione
function formatAddress(bin) {
  if (!bin || !bin.location || !bin.location.address) return 'Indirizzo non disponibile';
  
  const { street, streetNumber, city, postalCode } = bin.location.address;
  const parts = [];
  if (street) parts.push(street);
  if (streetNumber) parts.push(streetNumber);
  if (city) parts.push(city);
  if (postalCode) parts.push(postalCode);
  
  return parts.length > 0 ? parts.join(', ') : 'Indirizzo non disponibile';
}

// Log quando i cestini cambiano
watch(() => props.bins, (newBins) => {
  console.log('BinList received new bins:', newBins);
}, { deep: true });

// Log iniziale dei cestini
onMounted(() => {
  console.log('BinList initial bins:', props.bins);
});
</script>

<template>
  <div class="bins-list">
    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <p>Caricamento in corso...</p>
    </div>
    
    <div v-else-if="bins.length === 0" class="empty-state">
      <p>Nessun cestino disponibile</p>
    </div>
    
    <template v-else>
      <div 
        v-for="bin in bins" 
        :key="bin.id || bin._id"
        class="bin-item"
        :class="{ 'selected': selectedBinId === (bin.id || bin._id) }"
        @click="$emit('select-bin', bin)"
      >
        <div class="bin-icon" :style="{ backgroundColor: getBinColor(bin.type) + '20' }">
          <i class="fas" :class="getBinIcon(bin.type)" :style="{ color: getBinColor(bin.type) }"></i>
        </div>
        <div class="bin-details">
          <div class="bin-title">{{ bin.type || 'Cestino' }}</div>
          <div class="bin-address">{{ formatAddress(bin) }}</div>
          <div class="bin-fill-bar">
            <div 
              :style="{ width: `${bin.currentFillLevel || 0}%` }" 
              :class="getFillLevelClass(bin.currentFillLevel || 0)"
            ></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bins-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  max-height: calc(100vh - 200px); /* Sottraggo l'altezza approssimativa di header e controlli */
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
  min-width: 0; /* Per far funzionare text-overflow */
}

.bin-title {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
</style> 