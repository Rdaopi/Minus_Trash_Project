<template>
  <div class="report-details-container">
    <!-- Header with close button -->
    <div class="details-header">
      <h3>Dettagli Segnalazione</h3>
      <button @click="$emit('close')" class="close-button">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Caricamento dettagli...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button @click="$emit('retry')" class="retry-button">
        Riprova
      </button>
    </div>

    <!-- Report details -->
    <div v-else-if="report" class="details-content">
      <!-- Report type and severity -->
      <div class="detail-section">
        <div class="section-header">
          <div class="report-icon" :style="{ backgroundColor: getReportColor(report.reportType) + '20' }">
            <i class="fas" :class="getReportIcon(report.reportType)" :style="{ color: getReportColor(report.reportType) }"></i>
          </div>
          <div class="report-info">
            <h4>{{ formatReportType(report.reportType) }}</h4>
            <span class="severity-badge" :class="getSeverityClass(report.severity)">
              {{ report.severity || 'BASSA' }}
            </span>
          </div>
        </div>
        
        <div class="status-row">
          <span class="status-badge" :class="`status-${report.status || 'segnalato'}`">
            {{ formatStatus(report.status) }}
          </span>
        </div>
      </div>

      <!-- Location -->
      <div class="detail-section">
        <h5><i class="fas fa-map-marker-alt"></i> Posizione</h5>
        <p class="address">{{ formatAddress(report) }}</p>
        <div v-if="report.location?.coordinates" class="coordinates">
          <small>
            <i class="fas fa-crosshairs"></i>
            {{ report.location.coordinates[1]?.toFixed(6) }}, {{ report.location.coordinates[0]?.toFixed(6) }}
          </small>
        </div>
      </div>

      <!-- Description -->
      <div class="detail-section">
        <h5><i class="fas fa-align-left"></i> Descrizione</h5>
        <p class="description">{{ report.description || 'Nessuna descrizione fornita' }}</p>
      </div>

      <!-- Report subtype if exists -->
      <div v-if="report.reportSubtype" class="detail-section">
        <h5><i class="fas fa-tags"></i> Sottotipo</h5>
        <p>{{ formatReportSubtype(report.reportSubtype) }}</p>
      </div>

      <!-- Missed collection details if available -->
      <div v-if="report.missedCollectionDetails" class="detail-section">
        <h5><i class="fas fa-truck"></i> Dettagli Raccolta</h5>
        <div class="collection-details">
          <div v-if="report.missedCollectionDetails.wasteType" class="detail-item">
            <span class="label">Tipo rifiuto:</span>
            <span>{{ report.missedCollectionDetails.wasteType }}</span>
          </div>
          <div v-if="report.missedCollectionDetails.scheduledDate" class="detail-item">
            <span class="label">Data prevista:</span>
            <span>{{ formatDate(report.missedCollectionDetails.scheduledDate) }}</span>
          </div>
          <div v-if="report.missedCollectionDetails.area" class="detail-item">
            <span class="label">Area:</span>
            <span>{{ report.missedCollectionDetails.area }}</span>
          </div>
        </div>
      </div>

      <!-- Related bin if exists -->
      <div v-if="report.relatedBin" class="detail-section">
        <h5><i class="fas fa-trash-can"></i> Cestino Correlato</h5>
        <p>{{ report.relatedBin }}</p>
      </div>

      <!-- Dates and reporter info -->
      <div class="detail-section">
        <h5><i class="fas fa-calendar"></i> Informazioni Temporali</h5>
        <div class="dates-info">
          <div class="detail-item">
            <span class="label">Segnalato il:</span>
            <span>{{ formatDate(report.createdAt) }}</span>
          </div>
          <div v-if="report.updatedAt && report.updatedAt !== report.createdAt" class="detail-item">
            <span class="label">Ultimo aggiornamento:</span>
            <span>{{ formatDate(report.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Reporter info if available -->
      <div v-if="report.reportedBy" class="detail-section">
        <h5><i class="fas fa-user"></i> Segnalato da</h5>
        <div class="reporter-info">
          <div class="detail-item" v-if="report.reportedBy.name">
            <span class="label">Nome:</span>
            <span>{{ report.reportedBy.name }}</span>
          </div>
          <div class="detail-item" v-if="report.reportedBy.email">
            <span class="label">Email:</span>
            <span>{{ report.reportedBy.email }}</span>
          </div>
        </div>
      </div>

      <!-- Images if available -->
      <div v-if="report.images && report.images.length > 0" class="detail-section">
        <h5><i class="fas fa-images"></i> Allegati</h5>
        <div class="images-container">
          <div v-for="(image, index) in report.images" :key="index" class="image-item">
            <img :src="image" :alt="`Allegato ${index + 1}`" @click="openImageModal(image)" />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-section">
        <button @click="centerOnMap" class="action-button primary">
          <i class="fas fa-crosshairs"></i>
          Centra sulla mappa
        </button>
        <button @click="changeStatus" class="action-button secondary">
          <i class="fas fa-edit"></i>
          Cambia stato
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <i class="fas fa-flag"></i>
      <p>Seleziona una segnalazione per vedere i dettagli</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  report: {
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

const emit = defineEmits(['close', 'retry', 'center-on-map', 'change-status']);

// Utility functions
const getReportIcon = (type) => {
  const typeMap = {
    'RIFIUTI_ABBANDONATI': 'fa-trash',
    'AREA_SPORCA': 'fa-broom',
    'PROBLEMA_CESTINO': 'fa-trash-can',
    'RACCOLTA_SALTATA': 'fa-clock',
    'VANDALISMO': 'fa-hammer',
    'SCARICO_ILLEGALE': 'fa-ban',
    'ALTRO': 'fa-exclamation',
    'default': 'fa-flag'
  };
  return typeMap[type?.toUpperCase()] || typeMap.default;
};

const getReportColor = (type) => {
  const colorMap = {
    'RIFIUTI_ABBANDONATI': '#e74c3c',
    'AREA_SPORCA': '#f39c12',
    'PROBLEMA_CESTINO': '#9b59b6',
    'RACCOLTA_SALTATA': '#3498db',
    'VANDALISMO': '#e67e22',
    'SCARICO_ILLEGALE': '#c0392b',
    'ALTRO': '#95a5a6',
    'default': '#7f8c8d'
  };
  return colorMap[type?.toUpperCase()] || colorMap.default;
};

const getSeverityClass = (severity) => {
  const severityMap = {
    'BASSA': 'severity-low',
    'MEDIA': 'severity-medium', 
    'ALTA': 'severity-high',
    'URGENTE': 'severity-urgent'
  };
  return severityMap[severity?.toUpperCase()] || 'severity-low';
};

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

const formatStatus = (status) => {
  const statusLabels = {
    'segnalato': 'Segnalato',
    'verificato': 'Verificato',
    'in_corso': 'In Corso',
    'risolto': 'Risolto',
    'archiviato': 'Archiviato'
  };
  return statusLabels[status?.toLowerCase()] || status || 'Segnalato';
};

const formatAddress = (report) => {
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
      if (address.postalCode) parts.push(address.postalCode);
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  }
  
  if (report.location?.coordinates) {
    const [lng, lat] = report.location.coordinates;
    return `Coordinate: ${lat?.toFixed(4)}, ${lng?.toFixed(4)}`;
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
  emit('center-on-map', props.report);
};

const changeStatus = () => {
  emit('change-status', props.report);
};

const openImageModal = (imageUrl) => {
  // Open image in a modal or new tab
  window.open(imageUrl, '_blank');
};
</script>

<style scoped>
.report-details-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  overflow-y: auto;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.details-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.close-button:hover {
  background: #f0f0f0;
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
  font-size: 2rem;
  margin-bottom: 12px;
}

.retry-button {
  padding: 8px 16px;
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  margin-top: 12px;
  transition: background 0.2s ease;
}

.retry-button:hover {
  background: rgba(220, 53, 69, 0.1);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 16px;
  color: #ccc;
}

/* Details content */
.details-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.report-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.report-icon i {
  font-size: 1.5rem;
}

.report-info h4 {
  margin: 0 0 4px 0;
  font-size: 1.2rem;
  color: #333;
}

.status-row {
  margin-top: 8px;
}

.severity-badge, .status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.severity-low {
  background: #d4edda;
  color: #155724;
}

.severity-medium {
  background: #fff3cd;
  color: #856404;
}

.severity-high {
  background: #f8d7da;
  color: #721c24;
}

.severity-urgent {
  background: #d1ecf1;
  color: #0c5460;
}

.status-segnalato {
  background: #e3f2fd;
  color: #1565c0;
}

.status-verificato {
  background: #fff3e0;
  color: #ef6c00;
}

.status-in_corso {
  background: #f3e5f5;
  color: #7b1fa2;
}

.status-risolto {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-archiviato {
  background: #f5f5f5;
  color: #616161;
}

.detail-section h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-section h5 i {
  color: #4CAF50;
  width: 14px;
}

.address {
  margin: 0;
  color: #333;
  line-height: 1.4;
}

.coordinates {
  margin-top: 4px;
}

.coordinates small {
  color: #888;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.description {
  margin: 0;
  color: #333;
  line-height: 1.5;
  white-space: pre-wrap;
}

.collection-details,
.dates-info,
.reporter-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
  min-width: 120px;
  font-size: 13px;
}

.detail-item span:last-child {
  color: #333;
  text-align: right;
  flex: 1;
  font-size: 13px;
}

.images-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.image-item:hover img {
  transform: scale(1.05);
}

.actions-section {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.action-button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.action-button.secondary:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

/* Scrollbar styling */
.details-content::-webkit-scrollbar {
  width: 6px;
}

.details-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.details-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.details-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 