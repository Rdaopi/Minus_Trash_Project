<template>
  <div class="report-management-wrapper">
    <div v-if="isAuthorized" class="report-management">
      <div class="management-header">
        <h2>Gestione Segnalazioni</h2>
        <div class="header-actions">
          <button 
            @click="handleInsertReport" 
            class="action-button insert-button"
            :disabled="loading || editMode"
          >
            <i class="fas fa-plus"></i>
            Nuova Segnalazione
          </button>
          <button 
            @click="handleUpdateReport" 
            class="action-button update-button"
            :disabled="loading || !selectedReportId || !editMode"
          >
            <i class="fas fa-save"></i>
            Aggiorna Segnalazione
          </button>
          <button 
            @click="handleDeleteReport" 
            class="action-button delete-button"
            :disabled="loading || !selectedReportId"
          >
            <i class="fas fa-trash"></i>
            Elimina Segnalazione
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
            :disabled="loading || !selectedReportId"
          >
            <i class="fas fa-toggle-on"></i>
            Cambia Stato
          </button>
          <button 
            @click="toggleReportList" 
            class="toggle-list-button"
            :class="{ 'active': showReportList }"
          >
            <i class="fas" :class="showReportList ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            Lista Segnalazioni
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
            :bins="[]"
            :reports="displayedReports.length > 0 ? displayedReports : reports"
            :selected-report-id="selectedReportId"
            @report-click="handleReportClick"
            @report-created="handleReportCreatedFromMap"
          />
        </div>
  
        <!-- Form e lista -->
        <div class="content-container">
          <!-- Form per l'inserimento/modifica delle segnalazioni -->
          <div class="form-container">
            <ReportsForm 
              ref="reportFormRef"
              :editMode="editMode"
              :reportData="selectedReportDetails"
              :selectedReportId="selectedReportId"
              @success="handleFormSuccess"
              @error="handleFormError"
              @cancel="handleFormCancel"
              @loading="handleFormLoading"
            />
          </div>
  
          <!-- Overlay della lista segnalazioni -->
          <div v-if="showReportList" class="reports-overlay" @click.self="toggleReportList">
            <div class="reports-sidebar" :class="{ 'reports-sidebar-visible': showReportList }">
              <div class="reports-header">
                <h4>Segnalazioni <span class="reports-count">{{ displayedReports.length > 0 ? displayedReports.length : reports.length }}</span></h4>
                <div class="header-controls">
                  <button @click="loadReports" class="icon-button refresh-button" :disabled="loading">
                    <i class="fas fa-redo" :class="{ 'fa-spin': loading }"></i>
                  </button>
                  <button @click="toggleReportList" class="close-button">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
  
              <div v-if="loading" class="loading-state">
                <div class="spinner"></div>
                <p>Caricamento segnalazioni in corso...</p>
              </div>
  
              <div v-else-if="error" class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>{{ error }}</p>
                <button @click="loadReports" class="retry-button">
                  Riprova
                </button>
              </div>
  
              <div v-else class="reports-list-wrapper">
                <!-- Show report details if a report is selected -->
                <div v-if="selectedReportDetails" class="report-details-panel">
                  <ReportDetails 
                    :report="selectedReportDetails"
                    :loading="loadingReportDetails"
                    :error="reportDetailsError"
                    @close="clearSelectedReport"
                    @retry="retryLoad"
                    @center-on-map="centerOnSelectedReport"
                    @change-status="handleChangeStatus"
                  />
                </div>
                
                <!-- Show report list if no report is selected -->
                <div v-else>
                  <ReportList 
                    :reports="reports"
                    :loading="loading"
                    :selected-report-id="selectedReportId"
                    :hide-header="true"
                    @select-report="handleReportSelect"
                    @reports-filtered="handleReportsFiltered"
                    ref="reportListRef"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  
    <!-- Accesso non autorizzato -->
    <div v-else class="unauthorized">
      <div class="unauthorized-message">
        <i class="fas fa-lock"></i>
        <h3>Accesso Limitato</h3>
        <p>Non hai i permessi necessari per accedere a questa sezione.</p>
        <button @click="goBack" class="back-button">
          <i class="fas fa-arrow-left"></i>
          Torna alla Dashboard
        </button>
      </div>
    </div>
  
    <!-- Status Change Modal -->
    <div v-if="showStatusModal" class="modal-overlay" @click.self="closeStatusModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Cambia Stato Segnalazione</h3>
          <button @click="closeStatusModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedReportDetails" class="report-info">
            <div class="report-icon" :style="{ backgroundColor: getReportColor(selectedReportDetails.severity) + '20' }">
              <i class="fas" :class="getReportIcon(selectedReportDetails.reportType, selectedReportDetails.severity)" :style="{ color: getReportColor(selectedReportDetails.severity) }"></i>
            </div>
            <div class="report-details">
              <h4>{{ formatReportType(selectedReportDetails.reportType) || 'Segnalazione' }}</h4>
              <p class="report-address">{{ selectedReportDetails.address || 'Indirizzo non disponibile' }}</p>
              <p class="current-status">
                <strong>Stato attuale:</strong> 
                <span class="status-badge" :class="`status-${selectedReportDetails.status || 'in_attesa'}`">
                  {{ formatReportStatus(selectedReportDetails.status) }}
                </span>
              </p>
              <p class="report-severity">
                <strong>Gravità:</strong> 
                <span class="severity-badge" :class="`severity-${selectedReportDetails.severity?.toLowerCase() || 'bassa'}`">
                  {{ selectedReportDetails.severity || 'BASSA' }}
                </span>
              </p>
            </div>
          </div>
          
          <div class="form-group">
            <label for="newReportStatus">
              <i class="fas fa-toggle-on"></i>
              Nuovo Stato *
            </label>
            <select 
              id="newReportStatus" 
              v-model="newStatus" 
              required
              class="form-control"
            >
              <option value="">Seleziona nuovo stato</option>
              <option value="IN_ATTESA">In Attesa</option>
              <option value="VERIFICATO">Verificato</option>
              <option value="IN_LAVORAZIONE">In Lavorazione</option>
              <option value="RISOLTO">Risolto</option>
              <option value="RIFIUTATO">Rifiutato</option>
              <option value="PROGRAMMATO">Programmato</option>
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
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import ReportsForm from '../components/ReportsForm.vue';
  import ReportList from '../components/ReportList.vue';
  import MapComponent from '../components/MapComponent.vue';
  import ReportDetails from '../components/ReportDetails.vue';
  import { reportsAPI } from '../services/api';
  import { useReportDetails } from '../composables/useReportDetails';
  import { useMessages } from '../composables/useMessages';
  import { useReportUtils } from '../composables/useReportUtils';
  
  const router = useRouter();
  
  //Component state management
  const showReportList = ref(false);
  const reports = ref([]);
  const displayedReports = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const mapRef = ref(null);
  const reportFormRef = ref(null);
  const reportListRef = ref(null);
  const editMode = ref(false);
  
  // Status change modal state
  const showStatusModal = ref(false);
  const newStatus = ref('');
  const statusLoading = ref(false);
  const statusError = ref(null);

  // Use composables
  const {
    selectedReportId,
    selectedReportDetails,
    loading: loadingReportDetails,
    error: reportDetailsError,
    hasSelectedReport,
    loadReportDetails,
    clearSelection,
    retryLoad
  } = useReportDetails();

  const { successMessage, showSuccess } = useMessages();

  const { formatReportType, formatReportStatus, getReportIcon, getReportColor } = useReportUtils();

  // User role management
  const currentUserRole = ref(localStorage.getItem('userRole'));

  //Check if current user has operator or admin privileges for report management
  const isAuthorized = computed(() => {
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    
    console.log('=== AUTHORIZATION CHECK ===');
    console.log('Current user role:', userRole);
    console.log('Has token:', !!token);
    
    // Must have a valid token
    if (!token) {
      console.log('❌ No token found');
      return false;
    }
    
    // Allow citizens to view reports (temporarily), operators and admins to manage them
    const authorizedRoles = ['cittadino', 'operatore_comunale', 'amministratore'];
    const isAuthorized = authorizedRoles.includes(userRole);
    
    console.log('Authorized roles:', authorizedRoles);
    console.log('Is user authorized for report management?', isAuthorized);
    
    return isAuthorized;
  });

  // Go back to dashboard
  const goBack = () => {
    router.push('/dashboard');
  };

  //Load reports data from server
  async function loadReports() {
    if (loading.value) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      console.log('Loading reports...');
      const data = await reportsAPI.getAllReports();
      console.log('Segnalazioni caricate:', data);
      reports.value = data;
    } catch (err) {
      console.error('Errore nel caricamento delle segnalazioni:', err);
      error.value = 'Impossibile caricare la lista delle segnalazioni. Riprova più tardi.';
    } finally {
      loading.value = false;
    }
  }

  //Toggle report list visibility and load data when opening
  async function toggleReportList() {
    if (!showReportList.value) {
      //Load data when opening the list
      await loadReports();
    }
    //Toggle visibility state
    showReportList.value = !showReportList.value;
  }

  //New event handlers for form events
  function handleFormSuccess(event) {
    console.log('Form success event received:', event);
    
    // Reload reports list
    loadReports();
    
    // Show success message
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
    if (reportFormRef.value) {
      reportFormRef.value.resetForm();
    }
    // If in edit mode, also clear selection
    if (editMode.value) {
      editMode.value = false;
      clearSelection();
    }
  }

  //Handle report selection from list and center map
  async function handleReportSelect(report) {
    console.log('=== REPORT SELECTION DEBUG ===');
    console.log('Selected report object:', report);
    
    const reportId = report.id || report._id;
    console.log('Extracted report ID:', reportId);
    console.log('Report ID type:', typeof reportId);
    
    if (!reportId) {
      console.error('ERROR: No valid ID found in report object');
      error.value = 'Impossibile identificare la segnalazione selezionata.';
      return;
    }
    
    // Load report details
    await loadReportDetails(reportId);
    
    // Enter edit mode when selecting a report
    editMode.value = true;
    console.log('Edit mode activated:', editMode.value);
    
    //Center map on selected report
    if (mapRef.value && report.location?.coordinates) {
      console.log('Centering map on report:', report);
      const [lng, lat] = report.location.coordinates;
      mapRef.value.centerOnReport({
        latitude: lat,
        longitude: lng
      });
    }
  }

  //Handle report marker click on map
  async function handleReportClick(report) {
    const reportId = report.id || report._id;
    
    // Load report details
    await loadReportDetails(reportId);
    
    // Enter edit mode when clicking a report
    editMode.value = true;
    
    //Center map when clicking a marker
    if (mapRef.value && report.location?.coordinates) {
      const [lng, lat] = report.location.coordinates;
      mapRef.value.centerOnReport({
        latitude: lat,
        longitude: lng
      });
    }
  }

  //Handle filtered reports from ReportList component
  function handleReportsFiltered(filtered) {
    displayedReports.value = filtered;
    console.log('Filtered reports received in ReportManagement:', filtered.length);
  }

  //Handle insert report button click from header
  function handleInsertReport() {
    console.log('handleInsertReport called');
    
    // Simply trigger the form submit if not in edit mode
    if (!editMode.value && reportFormRef.value) {
      reportFormRef.value.forceSubmit();
    } else {
      error.value = 'Impossibile inserire: form in modalità modifica o riferimento non trovato.';
    }
  }

  // Handle update report button click
  function handleUpdateReport() {
    console.log('=== HANDLE UPDATE REPORT DEBUG ===');
    console.log('handleUpdateReport called');
    console.log('editMode.value:', editMode.value);
    console.log('selectedReportId.value:', selectedReportId.value);
    console.log('reportFormRef.value:', reportFormRef.value);
    
    // Simply trigger the form submit if in edit mode
    if (editMode.value && reportFormRef.value && selectedReportId.value) {
      console.log('All conditions met, calling forceSubmit...');
      reportFormRef.value.forceSubmit();
    } else {
      console.log('Conditions not met:', {
        editMode: editMode.value,
        hasFormRef: !!reportFormRef.value,
        hasSelectedReportId: !!selectedReportId.value
      });
      error.value = 'Nessuna segnalazione selezionata per l\'aggiornamento o form non in modalità modifica.';
    }
  }

  // Handle delete report button click
  async function handleDeleteReport() {
    if (!selectedReportId.value) {
      error.value = 'Nessuna segnalazione selezionata per l\'eliminazione.';
      return;
    }
    
    // Show confirmation dialog
    const confirmed = confirm(`Sei sicuro di voler eliminare la segnalazione ${selectedReportId.value}? Questa azione non può essere annullata.`);
    
    if (!confirmed) {
      return;
    }
    
    try {
      loading.value = true;
      error.value = null;
      
      console.log('Deleting report:', selectedReportId.value);
      
      //Send delete request to server
      await reportsAPI.deleteReport(selectedReportId.value);
      console.log('Report deleted successfully');
      
      //Reload reports list
      await loadReports();
      
      //Exit edit mode
      editMode.value = false;
      
      //Clear selection
      clearSelection();
      
      //Reset form
      reportFormRef.value?.resetForm();
      
      //Show success message
      showSuccess('Segnalazione eliminata con successo!');
      
    } catch (err) {
      console.error('Errore durante l\'eliminazione della segnalazione:', err);
      error.value = err.message || 'Errore durante l\'eliminazione della segnalazione. Riprova più tardi.';
    } finally {
      loading.value = false;
    }
  }

  //Check authorization and initialize component on mount
  onMounted(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    console.log('=== REPORT MANAGEMENT MOUNT ===');
    console.log('Token:', !!token);
    console.log('User role at mount:', userRole);
    
    if (!token) {
      console.log('❌ No token found - user not logged in');
      error.value = 'Sessione scaduta. Effettua nuovamente il login.';
      // Optionally redirect to login
      // router.push('/login');
      return;
    }
    
    if (!isAuthorized.value) {
      console.log('❌ User is not authorized for report management');
      console.log('Current role:', userRole);
      console.log('Required roles: cittadino, operatore_comunale, amministratore');
      return;
    }
    
    console.log('✅ User is authorized, loading reports...');
    loadReports();
  });

  // Handle clearing selected report
  function clearSelectedReport() {
    clearSelection();
    editMode.value = false;
  }

  // Handle center on selected report
  function centerOnSelectedReport(report) {
    if (mapRef.value && report.location?.coordinates) {
      const [lng, lat] = report.location.coordinates;
      mapRef.value.centerOnReport({
        latitude: lat,
        longitude: lng
      });
    }
  }

  // Handle change status
  function handleChangeStatus() {
    if (!selectedReportId.value) {
      error.value = 'Nessuna segnalazione selezionata per il cambio di stato.';
      return;
    }
    
    if (!selectedReportDetails.value) {
      error.value = 'Dettagli della segnalazione non disponibili.';
      return;
    }
    
    // Reset modal state
    newStatus.value = '';
    statusError.value = null;
    
    // Open status modal
    showStatusModal.value = true;
  }

  // Status change modal functions
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
    
    if (newStatus.value === selectedReportDetails.value.status) {
      statusError.value = 'Il nuovo stato è uguale a quello attuale.';
      return;
    }

    statusLoading.value = true;
    statusError.value = null;

    try {
      console.log('Updating report status:', selectedReportId.value, 'to', newStatus.value);
      
      // Update report status via API
      await reportsAPI.updateReportStatus(selectedReportId.value, newStatus.value);
      
      // Show success message
      showSuccess(`Stato segnalazione aggiornato a "${formatReportStatus(newStatus.value)}" con successo!`);
      
      // Reload reports and report details
      await loadReports();
      if (selectedReportId.value) {
        await loadReportDetails(selectedReportId.value);
      }
      
      // Close modal
      closeStatusModal();
      
    } catch (err) {
      console.error('Error updating report status:', err);
      statusError.value = err.message || 'Errore durante l\'aggiornamento dello stato della segnalazione.';
    } finally {
      statusLoading.value = false;
    }
  }

// Handle report created from map
function handleReportCreatedFromMap(report) {
  console.log('Report created from map:', report);
  
  // Show success message using the existing success message system
  showSuccess('Segnalazione creata con successo dalla mappa! Il problema segnalato verrà preso in carico dal nostro team.');
  
  // Reload reports to include the new one
  loadReports();
}
</script>
  
<style scoped>
.report-management-wrapper {
  height: calc(100vh - 64px);
  width: 100%;
}

.report-management {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* Unauthorized access styling */
.unauthorized {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.unauthorized-message {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
  border: 1px solid #e1e5e9;
}

.unauthorized-message i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 20px;
  display: block;
}

.unauthorized-message h3 {
  color: #333;
  margin-bottom: 16px;
  font-size: 1.5rem;
  font-weight: 600;
}

.unauthorized-message p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.back-button:hover {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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

.insert-button {
  background: var(--primary-color);
  color: white;
}

.insert-button:hover:not(:disabled) {
  background: #0056b3;
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

.status-button {
  background: #28a745;
  color: white;
}

.status-button:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
}

.status-button:disabled {
  background: #ccc;
  cursor: not-allowed;
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
}

.toggle-list-button.active {
  background: #0056b3;
}

.management-layout {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
  height: calc(100vh - 120px);
  position: relative;
}

.map-container {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.content-container {
  width: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  position: relative;
}

.form-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

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

/* Loading and error states */
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

.retry-button {
  margin-top: 12px;
  padding: 8px 16px;
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
}

/* Reports overlay */
.reports-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: flex-end;
  z-index: 1000;
}

.reports-sidebar {
  background: white;
  width: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.reports-sidebar-visible {
  transform: translateX(0);
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  flex-shrink: 0;
}

.reports-header h4 {
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

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
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

.refresh-button {
  color: #4CAF50;
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

.reports-list-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.report-details-panel {
  flex: 1;
  overflow: hidden;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.back-button:hover {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design */
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
  .report-management {
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

  .unauthorized-message {
    padding: 30px 20px;
    margin: 10px;
  }

  .unauthorized-message h3 {
    font-size: 1.3rem;
  }

  .role-list {
    padding: 15px;
  }

  /* Modal responsive styles */
  .modal-container {
    margin: 10px;
    max-width: calc(100vw - 20px);
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .report-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .report-icon {
    align-self: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-button, .submit-button {
    width: 100%;
  }
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

.report-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.report-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.report-icon i {
  font-size: 1.5rem;
}

.report-details h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.report-address {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.current-status, .report-severity {
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.current-status:last-child, .report-severity:last-child {
  margin-bottom: 0;
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

.status-in_attesa {
  background: #e3f2fd;
  color: #1565c0;
}

.status-verificato {
  background: #fff3e0;
  color: #ef6c00;
}

.status-in_lavorazione {
  background: #f3e5f5;
  color: #7b1fa2;
}

.status-risolto {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-rifiutato {
  background: #ffebee;
  color: #c62828;
}

.status-programmato {
  background: #e0f2f1;
  color: #00695c;
}

.severity-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.severity-bassa {
  background: #fff3cd;
  color: #856404;
}

.severity-media {
  background: #ffeaa7;
  color: #b7791f;
}

.severity-alta {
  background: #f8d7da;
  color: #721c24;
}

.severity-urgente {
  background: #d1ecf1;
  color: #0c5460;
}
</style> 