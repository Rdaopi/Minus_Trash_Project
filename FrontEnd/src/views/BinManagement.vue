<template>
  <div v-if="isOperator" class="bin-management">
    <div class="management-header">
      <h2>Gestione Cestini</h2>
      <div class="header-actions">
        <button 
          @click="handleInsertBin" 
          class="action-button insert-button"
          :disabled="loading || editMode"
        >
          <i class="fas fa-plus"></i>
          Inserisci Cestino
        </button>
        <button 
          @click="handleUpdateBin" 
          class="action-button update-button"
          :disabled="loading || !selectedBinId || !editMode"
        >
          <i class="fas fa-save"></i>
          Aggiorna Cestino
        </button>
        <button 
          @click="handleDeleteBin" 
          class="action-button delete-button"
          :disabled="loading || !selectedBinId"
        >
          <i class="fas fa-trash"></i>
          Elimina Cestino
        </button>
        <button 
          @click="handleResetForm" 
          class="action-button reset-button"
        >
          <i class="fas fa-undo"></i>
          Reset Form
        </button>
        <button 
          @click="handleChangeStatus" 
          class="action-button status-button"
          :disabled="loading || !selectedBinId"
        >
          <i class="fas fa-toggle-on"></i>
          Cambia Stato
        </button>
        <button 
          @click="toggleBinList" 
          class="toggle-list-button"
          :class="{ 'active': showBinList }"
        >
          <i class="fas" :class="showBinList ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          Lista Cestini
        </button>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      <i class="fas fa-check-circle"></i>
      <span>{{ successMessage }}</span>
      <button @click="successMessage = null" class="close-message">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ error }}</span>
      <button @click="error = null" class="close-message">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="management-layout">
      <!-- Mappa -->
      <div class="map-container">
        <MapComponent 
          ref="mapRef"
          :bins="displayedBins.length > 0 ? displayedBins : bins"
          :selected-bin-id="selectedBinId"
          @bin-click="handleBinClick"
          @report-created="handleReportCreated"
        />
      </div>

      <!-- Form e lista -->
      <div class="content-container">
        <!-- Form per l'inserimento/modifica dei cestini -->
        <div class="form-container">
          <BinForm 
            ref="binFormRef"
            :editMode="editMode"
            :binData="selectedBinDetails"
            :selectedBinId="selectedBinId"
            @success="handleFormSuccess"
            @error="handleFormError"
            @cancel="handleFormCancel"
            @loading="handleFormLoading"
          />
        </div>

        <!-- Overlay della lista cestini -->
        <div v-if="showBinList" class="bins-overlay" @click.self="toggleBinList">
          <div class="bins-sidebar" :class="{ 'bins-sidebar-visible': showBinList }">
            <div class="bins-header">
              <h4>Cestini <span class="bins-count">{{ displayedBins.length > 0 ? displayedBins.length : bins.length }}</span></h4>
              <div class="header-controls">
                <button @click="loadBins" class="icon-button refresh-button" :disabled="loading">
                  <i class="fas fa-redo" :class="{ 'fa-spin': loading }"></i>
                </button>
                <button @click="toggleBinList" class="close-button">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>Caricamento cestini in corso...</p>
            </div>

            <div v-else-if="error" class="error-state">
              <i class="fas fa-exclamation-circle"></i>
              <p>{{ error }}</p>
              <button @click="loadBins" class="retry-button">
                Riprova
              </button>
            </div>

            <div v-else class="bins-list-wrapper">
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
                  @select-bin="handleBinSelect"
                  @bins-filtered="handleBinsFiltered"
                  ref="binListRef"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Change Modal -->
    <div v-if="showStatusModal" class="modal-overlay" @click.self="closeStatusModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Cambia Stato Cestino</h3>
          <button @click="closeStatusModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedBinDetails" class="bin-info">
            <div class="bin-icon" :style="{ backgroundColor: getBinColor(selectedBinDetails.type) + '20' }">
              <i class="fas" :class="getBinIcon(selectedBinDetails.type)" :style="{ color: getBinColor(selectedBinDetails.type) }"></i>
            </div>
            <div class="bin-details">
              <h4>{{ selectedBinDetails.type || 'Cestino' }}</h4>
              <p class="bin-address">{{ formatBinAddress(selectedBinDetails) }}</p>
              <p class="current-status">
                <strong>Stato attuale:</strong> 
                <span class="status-badge" :class="`status-${selectedBinDetails.status || 'attivo'}`">
                  {{ selectedBinDetails.status || 'attivo' }}
                </span>
              </p>
            </div>
          </div>
          
          <div class="form-group">
            <label for="newStatus">
              <i class="fas fa-toggle-on"></i>
              Nuovo Stato *
            </label>
            <select 
              id="newStatus" 
              v-model="newStatus" 
              required
              class="form-control"
            >
              <option value="">Seleziona nuovo stato</option>
              <option value="attivo">Attivo</option>
              <option value="manutenzione">Manutenzione</option>
              <option value="inattivo">Inattivo</option>
            </select>
          </div>
          
          <div v-if="statusError" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ statusError }}</span>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeStatusModal" class="cancel-button" :disabled="statusLoading">
              <i class="fas fa-times"></i>
              Annulla
            </button>
            <button @click="confirmStatusChange" class="submit-button" :disabled="statusLoading || !newStatus">
              <i class="fas fa-check" :class="{ 'fa-spin': statusLoading }"></i>
              {{ statusLoading ? 'Aggiornamento...' : 'Conferma Cambio' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="unauthorized">
    <i class="fas fa-lock"></i>
    <h2>Accesso non autorizzato</h2>
    <p>Solo gli operatori possono accedere a questa sezione.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import BinForm from '../components/BinForm.vue';
import BinList from '../components/BinList.vue';
import MapComponent from '../components/MapComponent.vue';
import BinDetails from '../components/BinDetails.vue';
import { binsAPI } from '../services/api';
import { useBinDetails } from '../composables/useBinDetails';
import { useMessages } from '../composables/useMessages';
import { useBinUtils } from '../composables/useBinUtils';

const router = useRouter();

//Component state management
const showBinList = ref(false);
const bins = ref([]);
const displayedBins = ref([]);
const loading = ref(false);
const error = ref(null);
const mapRef = ref(null);
const binFormRef = ref(null);
const binListRef = ref(null);
const editMode = ref(false);

// Status change modal state
const showStatusModal = ref(false);
const newStatus = ref('');
const statusLoading = ref(false);
const statusError = ref(null);

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

const { successMessage, showSuccess, handleReportSuccess } = useMessages();

const { getBinIcon, getBinColor, formatBinAddress } = useBinUtils();

//Check if current user has operator or admin privileges
const isOperator = computed(() => {
  const userRole = localStorage.getItem('userRole');
  console.log('Current user role:', userRole);
  const isAuthorized = userRole === 'operatore_comunale' || userRole === 'amministratore';
  console.log('Is user authorized?', isAuthorized);
  return isAuthorized;
});

//Load bins data from server
async function loadBins() {
  if (loading.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    const data = await binsAPI.getAllBins();
    console.log('Cestini caricati:', data);
    bins.value = data;
  } catch (err) {
    console.error('Errore nel caricamento dei cestini:', err);
    error.value = 'Impossibile caricare la lista dei cestini. Riprova più tardi.';
  } finally {
    loading.value = false;
  }
}

//Toggle bin list visibility and load data when opening
async function toggleBinList() {
  if (!showBinList.value) {
    //Load data when opening the list
    await loadBins();
  }
  //Toggle visibility state
  showBinList.value = !showBinList.value;
}

//New event handlers for form events
function handleFormSuccess(event) {
  console.log('Form success event received:', event);
  
  // Reload bins list
  loadBins();
  
  // Show success message using composable
  showSuccess(event.message);
  
  // Clear edit mode and selection if this was an update/delete
  if (event.type === 'update') {
    editMode.value = false;
    clearSelection();
  }
}

function handleFormError(event) {
  console.log('Form error event received:', event);
  error.value = event.message;
}

function handleFormCancel() {
  console.log('Form cancel event received');
  
  // Reset edit mode and clear selection
  editMode.value = false;
  clearSelection();
}

function handleFormLoading(isLoading) {
  console.log('Form loading state:', isLoading);
  loading.value = isLoading;
}

//Handle form reset button click
function handleResetForm() {
  if (binFormRef.value) {
    binFormRef.value.resetForm();
  }
  // If in edit mode, also clear selection
  if (editMode.value) {
    editMode.value = false;
    clearSelection();
  }
}

//Handle bin selection from list and center map
async function handleBinSelect(bin) {
  console.log('=== BIN SELECTION DEBUG ===');
  console.log('Selected bin object:', bin);
  
  const binId = bin.id || bin._id;
  console.log('Extracted bin ID:', binId);
  console.log('Bin ID type:', typeof binId);
  
  if (!binId) {
    console.error('ERROR: No valid ID found in bin object');
    error.value = 'Impossibile identificare il cestino selezionato.';
    return;
  }
  
  // Load bin details
  await loadBinDetails(binId);
  
  // Enter edit mode when selecting a bin
  editMode.value = true;
  console.log('Edit mode activated:', editMode.value);
  
  //Center map on selected bin
  if (mapRef.value) {
    console.log('Centering map on bin:', bin);
    mapRef.value.centerOnBin({
      latitude: bin.lat || bin.latitude || (bin.location?.coordinates?.[1]),
      longitude: bin.lng || bin.longitude || (bin.location?.coordinates?.[0])
    });
  }
}

//Handle bin marker click on map
async function handleBinClick(bin) {
  const binId = bin.id || bin._id;
  
  // Load bin details
  await loadBinDetails(binId);
  
  // Enter edit mode when clicking a bin
  editMode.value = true;
  
  //Center map when clicking a marker
  if (mapRef.value) {
    mapRef.value.centerOnBin({
      latitude: bin.lat || bin.latitude || (bin.location?.coordinates?.[1]),
      longitude: bin.lng || bin.longitude || (bin.location?.coordinates?.[0])
    });
  }
}

//Handle filtered bins from BinList component
function handleBinsFiltered(filtered) {
  displayedBins.value = filtered;
  console.log('Filtered bins received in BinManagement:', filtered.length);
}

//Handle insert bin button click from header
function handleInsertBin() {
  console.log('handleInsertBin called');
  
  // Simply trigger the form submit if not in edit mode
  if (!editMode.value && binFormRef.value) {
    binFormRef.value.forceSubmit();
  } else {
    error.value = 'Impossibile inserire: form in modalità modifica o riferimento non trovato.';
  }
}

//Handle exit edit mode
function exitEditMode() {
  editMode.value = false;
  clearSelection();
  binFormRef.value?.resetForm();
}

//Check authorization and initialize component on mount
onMounted(() => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  console.log('Token:', token);
  console.log('User role at mount:', userRole);
  
  if (!token) {
    console.log('No token found');
    error.value = 'Sessione scaduta. Effettua nuovamente il login.';
    return;
  }
  
  if (!isOperator.value) {
    console.log('User is not authorized');
    error.value = 'Non hai i permessi necessari per accedere a questa sezione.';
    return;
  }
  
  console.log('User is authorized, loading bins...');
  loadBins();
});

// Handle clearing selected bin
function clearSelectedBin() {
  clearSelection();
  editMode.value = false;
}

// Handle center on selected bin
function centerOnSelectedBin(bin) {
  if (mapRef.value) {
    mapRef.value.centerOnBin({
      latitude: bin.lat || bin.latitude || (bin.location?.coordinates?.[1]),
      longitude: bin.lng || bin.longitude || (bin.location?.coordinates?.[0])
    });
  }
}

// Handle report created event from MapComponent
function handleReportCreated(report) {
  console.log('Report created successfully:', report);
  
  // Show success message
  showSuccess('Segnalazione inviata con successo! Il problema segnalato verrà preso in carico dal nostro team.');
  
  // Optionally reload bins data to reflect any changes
  // loadBins();
}

// Handle report created event from BinDetails component
function handleReportCreatedFromBin(report) {
  console.log('Report created from bin details:', report);
  
  // Show success message
  showSuccess('Segnalazione inviata con successo! Il problema segnalato verrà preso in carico dal nostro team.');
  
  // Optionally reload bins data to reflect any changes
  // loadBins();
}

// Handle update bin button click
function handleUpdateBin() {
  console.log('=== HANDLE UPDATE BIN DEBUG ===');
  console.log('handleUpdateBin called');
  console.log('editMode.value:', editMode.value);
  console.log('selectedBinId.value:', selectedBinId.value);
  console.log('binFormRef.value:', binFormRef.value);
  
  // Simply trigger the form submit if in edit mode
  if (editMode.value && binFormRef.value && selectedBinId.value) {
    console.log('All conditions met, calling forceSubmit...');
    binFormRef.value.forceSubmit();
  } else {
    console.log('Conditions not met:', {
      editMode: editMode.value,
      hasFormRef: !!binFormRef.value,
      hasSelectedBinId: !!selectedBinId.value
    });
    error.value = 'Nessun cestino selezionato per l\'aggiornamento o form non in modalità modifica.';
  }
}

// Handle delete bin button click
async function handleDeleteBin() {
  if (!selectedBinId.value) {
    error.value = 'Nessun cestino selezionato per l\'eliminazione.';
    return;
  }
  
  // Show confirmation dialog
  const confirmed = confirm(`Sei sicuro di voler eliminare il cestino ${selectedBinId.value}? Questa azione non può essere annullata.`);
  
  if (!confirmed) {
    return;
  }
  
  try {
    loading.value = true;
    error.value = null;
    
    console.log('Deleting bin:', selectedBinId.value);
    
    //Send delete request to server
    await binsAPI.deleteBin(selectedBinId.value);
    console.log('Bin deleted successfully');
    
    //Reload bins list
    await loadBins();
    
    //Exit edit mode
    editMode.value = false;
    
    //Clear selection
    clearSelection();
    
    //Reset form
    binFormRef.value?.resetForm();
    
    //Show success message using composable
    showSuccess('Cestino eliminato con successo!');
    
  } catch (err) {
    console.error('Errore durante l\'eliminazione del cestino:', err);
    error.value = err.message || 'Errore durante l\'eliminazione del cestino. Riprova più tardi.';
  } finally {
    loading.value = false;
  }
}

// Handle change status button click
function handleChangeStatus() {
  if (!selectedBinId.value) {
    error.value = 'Nessun cestino selezionato per il cambio di stato.';
    return;
  }
  
  if (!selectedBinDetails.value) {
    error.value = 'Dettagli del cestino non disponibili.';
    return;
  }
  
  // Reset modal state
  newStatus.value = '';
  statusError.value = null;
  
  // Open status modal
  showStatusModal.value = true;
}

// Status change modal functions
function openStatusModal() {
  showStatusModal.value = true;
}

function closeStatusModal() {
  showStatusModal.value = false;
  newStatus.value = '';
  statusError.value = null;
}

async function confirmStatusChange() {
  if (!newStatus.value) {
    statusError.value = 'Seleziona un nuovo stato.';
    return;
  }
  
  if (newStatus.value === selectedBinDetails.value.status) {
    statusError.value = 'Il nuovo stato è uguale a quello attuale.';
    return;
  }

  statusLoading.value = true;
  statusError.value = null;

  try {
    console.log('Updating bin status:', selectedBinId.value, 'to', newStatus.value);
    
    // Update bin status via API
    await binsAPI.updateBinStatus(selectedBinId.value, newStatus.value);
    
    // Show success message
    showSuccess(`Stato cestino aggiornato a "${newStatus.value}" con successo!`);
    
    // Reload bins and bin details
    await loadBins();
    if (selectedBinId.value) {
      await loadBinDetails(selectedBinId.value);
    }
    
    // Close modal
    closeStatusModal();
    
  } catch (err) {
    console.error('Error updating bin status:', err);
    statusError.value = err.message || 'Errore durante l\'aggiornamento dello stato del cestino.';
  } finally {
    statusLoading.value = false;
  }
}
</script>

<style scoped>
.bin-management {
  height: calc(100vh - 64px); /* Total height minus header */
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.refresh-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  border-right: 2px solid #e0e0e0;
  margin-right: 8px;
}

.last-update-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  background: white;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.last-update-info i {
  color: #4CAF50;
}

.refresh-button {
  background: #17a2b8;
  color: white;
  padding: 6px 12px;
  font-size: 14px;
}

.refresh-button:hover:not(:disabled) {
  background: #138496;
  transform: translateY(-1px);
}

.refresh-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.auto-refresh-button {
  background: #6c757d;
  color: white;
  padding: 6px 10px;
  font-size: 12px;
  min-width: 50px;
}

.auto-refresh-button:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.auto-refresh-button.active {
  background: #28a745;
}

.auto-refresh-button.active:hover {
  background: #218838;
}

.insert-button {
  background: var(--primary-color);
  color: white;
}

.insert-button:hover:not(:disabled) {
  background: #0056b3;
  color: #fff;
  transform: translateY(-2px);
}

.insert-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.update-button {
  background: #28a745;
  color: white;
}

.update-button:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
}

.update-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.delete-button {
  background: #dc3545;
  color: white;
}

.delete-button:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-2px);
}

.delete-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.reset-button {
  background: #f0f0f0;
  color: #666;
}

.reset-button:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.management-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
  height: calc(100vh - 120px); /* Total height minus header and padding */
  position: relative;
}

.map-container {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.content-container {
  width: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s ease;
  height: 100%;
  position: relative;
}

.map-container :deep(.leaflet-container) {
  height: 100% !important;
  width: 100% !important;
}

/* Form container styling */
.form-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

/* Scrollbar styling for better aesthetics */
.form-container::-webkit-scrollbar {
  width: 8px;
}

.form-container::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}

.form-container::-webkit-scrollbar-thumb:hover {
  background-color: #aaa;
}

.toggle-list-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-list-button:hover {
  background: #0056b3;
  color: #fff;
}

.toggle-list-button.active {
  background: #0056b3;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-state {
  color: #dc3545;
}

.error-state i {
  font-size: 24px;
  margin-bottom: 8px;
}

.retry-button {
  margin-top: 12px;
  padding: 8px 16px;
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
}

.retry-button:hover {
  background: rgba(220, 53, 69, 0.1);
}

.unauthorized {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #666;
  padding: 20px;
}

.unauthorized i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #dc3545;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design breakpoints */
@media (max-width: 1024px) {
  .management-layout {
    flex-direction: column;
    height: auto;
  }

  .map-container {
    height: 50vh;
    min-height: 400px;
  }

  .content-container {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .bin-management {
    padding: 10px;
  }
  
  .management-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .action-button, .toggle-list-button {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }

  .map-container {
    height: 300px;
  }
}

/* Success and Error Messages styling */
.success-message, .error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin: 10px 0;
  border-radius: 8px;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.success-message i, .error-message i {
  font-size: 1.2rem;
}

.close-message {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  margin-left: auto;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.close-message:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Overlay della lista */
.bins-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  z-index: 1000;
}

.bins-sidebar {
  background: white;
  width: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.bins-sidebar-visible {
  transform: translateX(0);
}

.bins-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  flex-shrink: 0;
}

.bins-header h4 {
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
  background: #f0f0f0;
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

.bins-list-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Assicuriamoci che BinList.vue sia scrollabile */
.bins-list-wrapper :deep(.bins-list-container) {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bins-list-wrapper :deep(.bins-list) {
  flex: 1;
  overflow-y: scroll !important;
  overflow-x: hidden;
  min-height: 0;
  height: calc(100vh - 220px) !important; /* Riduco un po' l'altezza */
  max-height: calc(100vh - 220px) !important;
}

/* Scrollbar personalizzata per webkit browsers */
.bins-list-wrapper :deep(.bins-list)::-webkit-scrollbar {
  width: 6px;
}

.bins-list-wrapper :deep(.bins-list)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.bins-list-wrapper :deep(.bins-list)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.bins-list-wrapper :deep(.bins-list)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Bin details panel */
.bin-details-panel {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Form actions styling */
.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.submit-btn, .reset-btn, .cancel-btn, .exit-edit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  flex: 1;
  min-width: 120px;
  justify-content: center;
}

.submit-btn {
  background: var(--primary-color);
  color: white;
}

.submit-btn:hover {
  background: #0056b3;
  transform: translateY(-2px);
}

.update-btn {
  background: #28a745;
  color: white;
}

.update-btn:hover {
  background: #218838;
  transform: translateY(-2px);
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

.cancel-btn {
  background: #dc3545;
  color: white;
}

.cancel-btn:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.exit-edit-btn {
  background: #ffc107;
  color: #212529;
}

.exit-edit-btn:hover {
  background: #e0a800;
  transform: translateY(-2px);
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.status-button {
  background: #17a2b8;
  color: white;
}

.status-button:hover:not(:disabled) {
  background: #138496;
  transform: translateY(-2px);
}

.status-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.bin-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.bin-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bin-icon i {
  font-size: 1.5rem;
}

.bin-details h4 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.bin-address {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.current-status {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.form-group label i {
  color: #6b7280;
  width: 16px;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cancel-button, .submit-button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cancel-button {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.cancel-button:hover:not(:disabled) {
  background: #e5e7eb;
}

.submit-button {
  background: #3b82f6;
  color: white;
}

.submit-button:hover:not(:disabled) {
  background: #2563eb;
}

.submit-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.cancel-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
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

.toggle-list-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-list-button:hover {
  background: #0056b3;
  color: #fff;
}

.toggle-list-button.active {
  background: #0056b3;
}
</style> 