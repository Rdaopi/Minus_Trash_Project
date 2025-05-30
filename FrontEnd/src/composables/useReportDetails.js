import { ref, computed, readonly } from 'vue';
import { reportsAPI } from '../services/api';

export function useReportDetails() {
  // State
  const selectedReportId = ref(null);
  const selectedReportDetails = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const hasSelectedReport = computed(() => !!selectedReportDetails.value);
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => !!error.value);

  // Methods
  const loadReportDetails = async (reportId) => {
    if (!reportId) {
      clearSelection();
      return;
    }

    selectedReportId.value = reportId;
    loading.value = true;
    error.value = null;
    
    try {
      console.log('Loading report details for ID:', reportId);
      const data = await reportsAPI.getReportById(reportId);
      console.log('Report details loaded:', data);
      selectedReportDetails.value = data;
    } catch (err) {
      console.error('Error loading report details:', err);
      error.value = err.message || 'Errore durante il caricamento dei dettagli della segnalazione';
      selectedReportDetails.value = null;
    } finally {
      loading.value = false;
    }
  };

  const clearSelection = () => {
    selectedReportId.value = null;
    selectedReportDetails.value = null;
    error.value = null;
    loading.value = false;
  };

  const retryLoad = () => {
    if (selectedReportId.value) {
      loadReportDetails(selectedReportId.value);
    }
  };

  // Return reactive state and methods
  return {
    // State
    selectedReportId: readonly(selectedReportId),
    selectedReportDetails: readonly(selectedReportDetails),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    hasSelectedReport,
    isLoading,
    hasError,
    
    // Methods
    loadReportDetails,
    clearSelection,
    retryLoad
  };
} 