<template>
  <div class="bin-details-container">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Caricamento dettagli cestino...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-button">
        <i class="fas fa-redo"></i> Riprova
      </button>
    </div>

    <!-- Bin details -->
    <div v-else-if="bin" class="bin-details">
      <!-- Header -->
      <div class="details-header">
        <div class="bin-type-info">
          <div class="bin-icon" :style="{ backgroundColor: getBinColor(bin.type) + '20' }">
            <i class="fas" :class="getBinIcon(bin.type)" :style="{ color: getBinColor(bin.type) }"></i>
          </div>
          <div class="type-text">
            <h3>{{ bin.type || 'Cestino' }}</h3>
            <span class="status-badge" :class="`status-${bin.status || 'attivo'}`">
              {{ bin.status || 'attivo' }}
            </span>
          </div>
        </div>
        <button @click="$emit('close')" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Fill level -->
      <div class="fill-level-section">
        <h4><i class="fas fa-chart-simple"></i> Livello di riempimento</h4>
        <div class="fill-level-display">
          <div class="fill-bar-container">
            <div 
              class="fill-bar" 
              :style="{ 
                width: `${bin.currentFillLevel || 0}%`,
                backgroundColor: getFillLevelColor(bin.currentFillLevel || 0)
              }"
            ></div>
          </div>
          <span class="fill-percentage">{{ bin.currentFillLevel || 0 }}%</span>
        </div>
      </div>

      <!-- Location info -->
      <div class="location-section">
        <h4><i class="fas fa-location-dot"></i> Posizione</h4>
        <div class="location-info">
          <p class="address">{{ formatAddress(bin) }}</p>
          <div class="coordinates" v-if="bin.lat && bin.lng">
            <span>Coordinate: {{ bin.lat.toFixed(6) }}, {{ bin.lng.toFixed(6) }}</span>
          </div>
        </div>
      </div>

      <!-- Technical details -->
      <div class="technical-section">
        <h4><i class="fas fa-cog"></i> Dettagli tecnici</h4>
        <div class="technical-grid">
          <div class="detail-item" v-if="bin.serialNumber">
            <span class="label">Numero seriale:</span>
            <span class="value">{{ bin.serialNumber }}</span>
          </div>
          <div class="detail-item" v-if="bin.manufacturer">
            <span class="label">Produttore:</span>
            <span class="value">{{ bin.manufacturer }}</span>
          </div>
          <div class="detail-item" v-if="bin.capacity">
            <span class="label">Capacità:</span>
            <span class="value">{{ bin.capacity }}L</span>
          </div>
          <div class="detail-item" v-if="bin.installationDate">
            <span class="label">Data installazione:</span>
            <span class="value">{{ formatDate(bin.installationDate) }}</span>
          </div>
          <div class="detail-item" v-if="bin.lastEmptied">
            <span class="label">Ultimo svuotamento:</span>
            <span class="value">{{ formatDate(bin.lastEmptied) }}</span>
          </div>
          <div class="detail-item" v-if="bin.lastMaintenance">
            <span class="label">Ultima manutenzione:</span>
            <span class="value">{{ formatDate(bin.lastMaintenance) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-section">
        <button @click="centerOnMap" class="action-button primary">
          <i class="fas fa-crosshairs"></i>
          Centra sulla mappa
        </button>
        <button @click="reportIssue" class="action-button secondary">
          <i class="fas fa-exclamation-triangle"></i>
          Segnala problema
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <i class="fas fa-trash-can"></i>
      <p>Seleziona un cestino per vedere i dettagli</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  bin: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close', 'retry', 'center-on-map', 'report-issue']);

// Utility functions
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

const getFillLevelColor = (level) => {
  if (level >= 80) return '#F44336'; // Red
  if (level >= 50) return '#FFC107'; // Yellow
  return '#4CAF50'; // Green
};

const formatAddress = (bin) => {
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
  
  if (bin.lat && bin.lng) {
    return `Coordinate: ${bin.lat.toFixed(4)}, ${bin.lng.toFixed(4)}`;
  }
  
  return 'Indirizzo non disponibile';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Non disponibile';
  try {
    return new Date(dateString).toLocaleDateString('it-IT');
  } catch {
    return 'Data non valida';
  }
};

const centerOnMap = () => {
  emit('center-on-map', props.bin);
};

const reportIssue = () => {
  emit('report-issue', props.bin);
};
</script>

<style scoped>
.bin-details-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  overflow-y: auto;
}

/* Loading and error states */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(76, 175, 80, 0.2);
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spinner 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #dc3545;
}

.error-state i {
  font-size: 24px;
  margin-bottom: 12px;
}

.retry-button {
  margin-top: 16px;
  padding: 8px 16px;
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-button:hover {
  background: rgba(220, 53, 69, 0.1);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
}

/* Bin details */
.bin-details {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.bin-type-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bin-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.bin-icon i {
  font-size: 1.8rem;
}

.type-text h3 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: #333;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.close-button:hover {
  background: #f0f0f0;
}

/* Sections */
.fill-level-section,
.location-section,
.technical-section,
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fill-level-section h4,
.location-section h4,
.technical-section h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fill-level-section h4 i,
.location-section h4 i,
.technical-section h4 i {
  color: #4CAF50;
}

/* Fill level */
.fill-level-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fill-bar-container {
  flex: 1;
  height: 12px;
  background: #eee;
  border-radius: 6px;
  overflow: hidden;
}

.fill-bar {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 6px;
}

.fill-percentage {
  font-weight: 600;
  color: #333;
  min-width: 40px;
  text-align: right;
}

/* Location */
.location-info .address {
  margin: 0;
  font-size: 1rem;
  color: #333;
  line-height: 1.4;
}

.coordinates {
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
}

/* Technical details */
.technical-grid {
  display: grid;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
}

.detail-item .value {
  font-weight: 600;
  color: #333;
  text-align: right;
}

/* Actions */
.actions-section {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.action-button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.action-button.primary {
  background: #4CAF50;
  color: white;
}

.action-button.primary:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.action-button.secondary {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.action-button.secondary:hover {
  background: #ffeaa7;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 480px) {
  .bin-details {
    padding: 16px;
    gap: 20px;
  }
  
  .bin-type-info {
    gap: 12px;
  }
  
  .bin-icon {
    width: 50px;
    height: 50px;
  }
  
  .bin-icon i {
    font-size: 1.5rem;
  }
  
  .type-text h3 {
    font-size: 1.3rem;
  }
  
  .actions-section {
    flex-direction: column;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-item .value {
    text-align: left;
  }
}

/* Scrollbar */
.bin-details-container::-webkit-scrollbar {
  width: 6px;
}

.bin-details-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.bin-details-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.bin-details-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 