<script setup>
import { defineProps, onMounted, watch, ref, computed } from 'vue';

const props = defineProps({
  reports: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedReportId: {
    type: String,
    default: null
  },
  hideHeader: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select-report', 'reports-filtered']);

// Filtri e ricerca
const searchQuery = ref('');
const selectedType = ref('');
const selectedStatus = ref('');
const selectedSeverity = ref('');

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

const setSeverityFilter = (severity) => {
  selectedSeverity.value = severity;
};

const clearAllFilters = () => {
  searchQuery.value = '';
  selectedType.value = '';
  selectedStatus.value = '';
  selectedSeverity.value = '';
};

const getFilterState = () => {
  return {
    searchQuery: searchQuery.value,
    selectedType: selectedType.value,
    selectedStatus: selectedStatus.value,
    selectedSeverity: selectedSeverity.value,
    hasActiveFilters: !!(searchQuery.value || selectedType.value || selectedStatus.value || selectedSeverity.value),
    totalReports: props.reports.length,
    filteredCount: filteredReports.value.length,
    hiddenCount: props.reports.length - filteredReports.value.length
  };
};

// Handle report selection
const handleReportSelect = (report) => {
  emit('select-report', report);
};

// Computed for filtered reports
const filteredReports = computed(() => {
  let filtered = [...props.reports];
  
  // Apply type filter
  if (selectedType.value) {
    filtered = filtered.filter(report => {
      const reportType = report.reportType?.toUpperCase();
      const selectedTypeUpper = selectedType.value.toUpperCase();
      return reportType === selectedTypeUpper;
    });
  }
  
  // Apply status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(report => {
      const reportStatus = report.status?.toLowerCase() || 'segnalato';
      const selectedStatusLower = selectedStatus.value.toLowerCase();
      return reportStatus === selectedStatusLower;
    });
  }
  
  // Apply severity filter
  if (selectedSeverity.value) {
    filtered = filtered.filter(report => {
      const reportSeverity = report.severity?.toUpperCase() || 'BASSA';
      const selectedSeverityUpper = selectedSeverity.value.toUpperCase();
      return reportSeverity === selectedSeverityUpper;
    });
  }
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(report => {
      const address = formatAddress(report).toLowerCase();
      const type = report.reportType?.toLowerCase() || '';
      const description = report.description?.toLowerCase() || '';
      return address.includes(query) || type.includes(query) || description.includes(query);
    });
  }
  
  console.log(`Filtered ${filtered.length} reports from ${props.reports.length} total`);
  return filtered;
});

// Watch for emitting filtered reports when they change
watch(filteredReports, (newFilteredReports) => {
  emit('reports-filtered', newFilteredReports);
}, { immediate: true });

const getSeverityClass = (severity) => {
  const severityMap = {
    'BASSA': 'severity-low',
    'MEDIA': 'severity-medium', 
    'ALTA': 'severity-high',
    'URGENTE': 'severity-urgent'
  };
  return severityMap[severity?.toUpperCase()] || 'severity-low';
};

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

// Format the address for display
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
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  }
  
  if (report.latitude && report.longitude) {
    return `Coordinate: ${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
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

// Watch props for debugging
watch(() => props.reports, (newReports) => {
  console.log('ReportList received new reports:', newReports);
}, { deep: true });

// Initial reports log
onMounted(() => {
  console.log('ReportList initial reports:', props.reports);
});

// Expose methods for external use
defineExpose({
  setSearchQuery,
  setTypeFilter,
  setStatusFilter,
  setSeverityFilter,
  clearAllFilters,
  getFilterState,
  filteredReports
});
</script>

<template>
  <div class="reports-list-container">
    <!-- Header with count -->
    <div class="list-header" v-if="!hideHeader">
      <h3>Segnalazioni <span class="reports-count">{{ filteredReports.length }}</span></h3>
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
    
    <!-- Controls for search and filters -->
    <div class="controls">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Cerca per indirizzo o descrizione..."
        >
      </div>
      
      <div class="filters-row">
        <div class="type-filter">
          <select v-model="selectedType">
            <option value="">Tutti i tipi</option>
            <option value="RIFIUTI_ABBANDONATI">Rifiuti Abbandonati</option>
            <option value="AREA_SPORCA">Area Sporca</option>
            <option value="PROBLEMA_CESTINO">Problema Cestino</option>
            <option value="RACCOLTA_SALTATA">Raccolta Saltata</option>
            <option value="VANDALISMO">Vandalismo</option>
            <option value="SCARICO_ILLEGALE">Scarico Illegale</option>
            <option value="ALTRO">Altro</option>
          </select>
        </div>
        
        <div class="status-filter">
          <select v-model="selectedStatus">
            <option value="">Tutti gli stati</option>
            <option value="segnalato">Segnalato</option>
            <option value="verificato">Verificato</option>
            <option value="in_corso">In Corso</option>
            <option value="risolto">Risolto</option>
            <option value="archiviato">Archiviato</option>
          </select>
        </div>
        
        <div class="severity-filter">
          <select v-model="selectedSeverity">
            <option value="">Tutte le gravità</option>
            <option value="BASSA">Bassa</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Reports List -->
    <div class="reports-list">
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <p>Caricamento in corso...</p>
      </div>
      
      <div v-else-if="filteredReports.length === 0" class="empty-state">
        <p v-if="searchQuery || selectedType || selectedStatus || selectedSeverity">
          Nessuna segnalazione trovata con i filtri applicati
        </p>
        <p v-else>Nessuna segnalazione disponibile</p>
      </div>
      
      <!-- Show reports list -->
      <div v-else class="reports-container">
        <div 
          v-for="report in filteredReports" 
          :key="report.id || report._id"
          class="report-item"
          :class="{ 'selected': selectedReportId === (report.id || report._id) }"
          @click="handleReportSelect(report)"
        >
          <div class="report-icon" :style="{ backgroundColor: getReportColor(report.reportType) + '20' }">
            <i class="fas" :class="getReportIcon(report.reportType)" :style="{ color: getReportColor(report.reportType) }"></i>
          </div>
          <div class="report-details">
            <div class="report-header">
              <div class="report-title">{{ formatReportType(report.reportType) }}</div>
              <span class="severity-badge" :class="getSeverityClass(report.severity)">
                {{ report.severity || 'BASSA' }}
              </span>
            </div>
            <div class="report-address">{{ formatAddress(report) }}</div>
            <div class="report-info">
              <span class="report-date">{{ formatDate(report.createdAt) }}</span>
              <span class="status-badge" :class="`status-${report.status || 'segnalato'}`">
                {{ report.status || 'segnalato' }}
              </span>
            </div>
            <div class="report-description" v-if="report.description">
              {{ report.description.substring(0, 100) }}{{ report.description.length > 100 ? '...' : '' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.reports-count {
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
}

.filter-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 12px;
}

.clear-filters-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.clear-filters-btn:hover {
  background: #f0f0f0;
}

.controls {
  padding: 16px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.search-box {
  margin-bottom: 12px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-box input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.filters-row {
  display: flex;
  gap: 8px;
}

.type-filter,
.status-filter,
.severity-filter {
  flex: 1;
}

.type-filter select,
.status-filter select,
.severity-filter select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  box-sizing: border-box;
}

.reports-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(76, 175, 80, 0.2);
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
  text-align: center;
}

.reports-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  align-items: flex-start;
  flex-shrink: 0;
}

.report-item:hover {
  background: #e9e9e9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.report-item.selected {
  border-left-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.report-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.report-icon i {
  font-size: 1.2rem;
}

.report-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.report-title {
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.severity-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
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

.report-address {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.report-date {
  font-size: 11px;
  color: #888;
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

.report-description {
  font-size: 11px;
  color: #777;
  line-height: 1.3;
  margin-top: 4px;
}

/* Scrollbar styling */
.reports-list::-webkit-scrollbar {
  width: 6px;
}

.reports-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.reports-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.reports-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 