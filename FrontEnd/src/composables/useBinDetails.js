import { ref, computed, readonly } from 'vue';
import { binsAPI } from '../services/api';

export function useBinDetails() {
  // State
  const selectedBinId = ref(null);
  const selectedBinDetails = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const hasSelectedBin = computed(() => !!selectedBinDetails.value);
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => !!error.value);

  // Methods
  const loadBinDetails = async (binId) => {
    if (!binId) {
      clearSelection();
      return;
    }

    selectedBinId.value = binId;
    loading.value = true;
    error.value = null;
    
    try {
      console.log('Loading bin details for ID:', binId);
      const data = await binsAPI.getBinById(binId);
      console.log('Bin details loaded:', data);
      selectedBinDetails.value = data;
    } catch (err) {
      console.error('Error loading bin details:', err);
      error.value = err.message || 'Errore durante il caricamento dei dettagli del cestino';
      selectedBinDetails.value = null;
    } finally {
      loading.value = false;
    }
  };

  const clearSelection = () => {
    selectedBinId.value = null;
    selectedBinDetails.value = null;
    error.value = null;
    loading.value = false;
  };

  const retryLoad = () => {
    if (selectedBinId.value) {
      loadBinDetails(selectedBinId.value);
    }
  };

  // Return reactive state and methods
  return {
    // State
    selectedBinId: readonly(selectedBinId),
    selectedBinDetails: readonly(selectedBinDetails),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    hasSelectedBin,
    isLoading,
    hasError,
    
    // Methods
    loadBinDetails,
    clearSelection,
    retryLoad
  };
} 