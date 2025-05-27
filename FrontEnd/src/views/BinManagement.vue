<template>
  <div v-if="isOperator" class="bin-management">
    <div class="management-header">
      <h2>Gestione Cestini</h2>
      <div class="header-actions">
        <button 
          @click="handleInsertBin" 
          class="action-button insert-button"
          :disabled="loading"
        >
          <i class="fas fa-plus"></i>
          Inserisci Cestino
        </button>
        <button 
          @click="handleResetForm" 
          class="action-button reset-button"
        >
          <i class="fas fa-undo"></i>
          Reset Form
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
        />
      </div>

      <!-- Form e lista -->
      <div class="content-container">
        <!-- Form per l'inserimento dei cestini -->
        <div class="form-container">
          <BinForm 
            @submit="handleBinSubmit" 
            @cancel="handleBinCancel"
            ref="binFormRef"
          >
            <div class="form-actions">
              <button type="submit" class="submit-btn">
                <i class="fas fa-plus"></i>
                Inserisci cestino
              </button>
              <button type="button" @click="resetForm" class="reset-btn">
                <i class="fas fa-undo"></i>
                Reset
              </button>
              <button type="button" @click="handleCancel" class="cancel-btn">
                <i class="fas fa-times"></i>
                Annulla
              </button>
            </div>
          </BinForm>
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
  <div v-else class="unauthorized">
    <i class="fas fa-lock"></i>
    <h2>Accesso non autorizzato</h2>
    <p>Solo gli operatori possono accedere a questa sezione.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import BinForm from '../components/BinForm.vue';
import BinList from '../components/BinList.vue';
import MapComponent from '../components/MapComponent.vue';
import { binsAPI } from '../services/api';

//Component state management
const showBinList = ref(false);
const bins = ref([]);
const displayedBins = ref([]);
const loading = ref(false);
const error = ref(null);
const successMessage = ref(null);
const selectedBinId = ref(null);
const mapRef = ref(null);
const binFormRef = ref(null);
const binListRef = ref(null);

//Check if current user has operator privileges
const isOperator = computed(() => {
  const userRole = localStorage.getItem('userRole');
  console.log('Current user role:', userRole);
  const isAuthorized = userRole === 'operatore_comunale';
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

//Handle bin form submission and data processing
async function handleBinSubmit(binData) {
  console.log('handleBinSubmit called with data:', binData);
  try {
    loading.value = true;
    error.value = null; //Clear previous errors
    
    //Validate essential location data
    if (!binData.city || !binData.latitude || !binData.longitude) {
      throw new Error('Dati di localizzazione mancanti. Assicurati di aver selezionato una città e un indirizzo validi.');
    }
    
    //Validate required bin data
    if (!binData.type || !binData.capacity || !binData.serialNumber || !binData.manufacturer) {
      throw new Error('Dati del cestino mancanti. Compila tutti i campi obbligatori.');
    }
    
    //Transform form data to match server schema
    const binPayload = {
      type: binData.type,
      capacity: parseInt(binData.capacity),
      serialNumber: binData.serialNumber,
      manufacturer: binData.manufacturer,
      installationDate: binData.installationDate,
      location: {
        type: 'Point',
        coordinates: [parseFloat(binData.longitude), parseFloat(binData.latitude)],
        address: {
          street: binData.street || '',
          streetNumber: binData.streetNumber || '',
          city: binData.city,
          postalCode: binData.cap || '',
          country: 'Italia'
        }
      },
      currentFillLevel: 0, //New bin starts empty
      status: 'attivo' //Active bin status
    };
    
    console.log('Sending bin data to server:', binPayload);
    
    //Send data to server
    const result = await binsAPI.createBin(binPayload);
    console.log('Bin created successfully:', result);
    
    //Reload bins list
    await loadBins();
    
    //Reset form after successful submission
    binFormRef.value?.resetForm();
    
    //Show success message
    showSuccessMessage('Cestino inserito con successo nel database!');
    
  } catch (err) {
    console.error('Errore durante il salvataggio del cestino:', err);
    error.value = err.message || 'Errore durante il salvataggio del cestino. Riprova più tardi.';
  } finally {
    loading.value = false;
  }
}

//Display success message with auto-hide functionality
function showSuccessMessage(message) {
  successMessage.value = message;
  //Auto-hide success message after 5 seconds
  setTimeout(() => {
    successMessage.value = null;
  }, 5000);
}

//Handle form cancellation
function handleBinCancel() {
  binFormRef.value?.resetForm();
}

//Reset form function
function resetForm() {
  if (binFormRef.value) {
    binFormRef.value.resetForm();
  }
}

//Handle cancel button
function handleCancel() {
  if (binFormRef.value) {
    binFormRef.value.resetForm();
  }
}

//Handle bin selection from list and center map
function handleBinSelect(bin) {
  selectedBinId.value = bin.id || bin._id;
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
function handleBinClick(bin) {
  selectedBinId.value = bin.id || bin._id;
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
  console.log('binFormRef.value:', binFormRef.value);
  
  if (!binFormRef.value) {
    console.error('binFormRef is null');
    error.value = 'Errore: riferimento al form non trovato.';
    return;
  }
  
  try {
    //Call BinForm component's handleSubmit function directly
    console.log('Calling handleSubmit...');
    binFormRef.value.handleSubmit();
    console.log('handleSubmit called successfully');
  } catch (err) {
    console.error('Error calling handleSubmit:', err);
    error.value = 'Errore durante l\'invio del form: ' + err.message;
  }
}

//Handle form reset button click
function handleResetForm() {
  if (binFormRef.value) {
    binFormRef.value.resetForm();
  }
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
  color: #fff;
  transform: translateY(-2px);
}

.insert-button:disabled {
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
  overflow-y: auto !important;
  overflow-x: hidden;
  min-height: 0;
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
</style> 