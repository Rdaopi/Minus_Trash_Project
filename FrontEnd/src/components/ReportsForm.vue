//Reusable form component for report creation and editing
<script setup>
import { ref, defineEmits, defineProps, watch, computed } from 'vue';
import BaseForm from './BaseForm.vue';
import { reportsAPI } from '../services/api';

// Variables for the report form management
const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  reportData: {
    type: Object,
    default: null
  },
  selectedReportId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['success', 'error', 'cancel', 'loading']);

// Reference to BaseForm component
const baseFormRef = ref(null);

// Form internal state
const loading = ref(false);
const error = ref(null);

//Form data reactive object (only report-specific fields)
const reportForm = ref({
  reportType: '',
  reportSubtype: '',
  severity: 'BASSA',
  description: '',
  images: [],
  // For missed collection reports
  missedCollectionDetails: {
    wasteType: '',
    scheduledDate: '',
    area: ''
  },
  // For bin-related reports
  relatedBin: ''
});

//Report types matching the backend enum
const reportTypes = [
  { value: 'RIFIUTI_ABBANDONATI', label: 'Rifiuti Abbandonati' },
  { value: 'AREA_SPORCA', label: 'Area Sporca' },
  { value: 'PROBLEMA_CESTINO', label: 'Problema Cestino' },
  { value: 'RACCOLTA_SALTATA', label: 'Raccolta Saltata' },
  { value: 'VANDALISMO', label: 'Vandalismo' },
  { value: 'SCARICO_ILLEGALE', label: 'Scarico illegale' },
  { value: 'ALTRO', label: 'Altro' }
];

//Severity levels matching backend enum
const severityLevels = [
  { value: 'BASSA', label: 'Bassa' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' }
];

//Waste types for missed collection and abandoned waste
const wasteTypes = [
  { value: 'PLASTICA', label: 'Plastica' },
  { value: 'CARTA', label: 'Carta' },
  { value: 'VETRO', label: 'Vetro' },
  { value: 'ORGANICO', label: 'Organico' },
  { value: 'RAEE', label: 'RAEE' },
  { value: 'INGOMBRANTI', label: 'Ingombranti' },
  { value: 'INDIFFERENZIATO', label: 'Indifferenziato' },
  { value: 'ALTRO', label: 'Altro' }
];

//Bin problem subtypes
const binSubtypes = [
  { value: 'ROTTO', label: 'Rotto' },
  { value: 'PIENO', label: 'Pieno' },
  { value: 'MANCANTE', label: 'Mancante' },
  { value: 'SPORCO', label: 'Sporco' }
];

// Computed properties for conditional fields
const showSubtype = computed(() => {
  return reportForm.value.reportType === 'PROBLEMA_CESTINO' || 
         reportForm.value.reportType === 'RIFIUTI_ABBANDONATI';
});

const showMissedCollectionDetails = computed(() => {
  return reportForm.value.reportType === 'RACCOLTA_SALTATA';
});

const showBinSelection = computed(() => {
  return reportForm.value.reportType === 'PROBLEMA_CESTINO' && 
         reportForm.value.reportSubtype !== 'MANCANTE';
});

const availableSubtypes = computed(() => {
  if (reportForm.value.reportType === 'PROBLEMA_CESTINO') {
    return binSubtypes;
  } else if (reportForm.value.reportType === 'RIFIUTI_ABBANDONATI') {
    return wasteTypes;
  }
  return [];
});

// Watch for report type changes to reset subtype
watch(() => reportForm.value.reportType, (newType) => {
  reportForm.value.reportSubtype = '';
  if (newType !== 'RACCOLTA_SALTATA') {
    reportForm.value.missedCollectionDetails = {
      wasteType: '',
      scheduledDate: '',
      area: ''
    };
  }
  if (newType !== 'PROBLEMA_CESTINO') {
    reportForm.value.relatedBin = '';
  }
});

//Handle form submission with API calls
async function handleSubmit() {
  console.log('=== REPORT FORM HANDLE SUBMIT ===');
  console.log('ReportForm handleSubmit called');
  console.log('Report form data:', reportForm.value);
  console.log('Address form data:', baseFormRef.value?.addressForm);
  console.log('Edit mode:', props.editMode);
  console.log('Selected report ID:', props.selectedReportId);
  
  // Clear previous errors
  error.value = null;
  
  try {
    // Set loading state
    loading.value = true;
    emit('loading', true);
    
    // Validate required fields
    const addressData = baseFormRef.value?.addressForm;
    if (!addressData?.city || !addressData?.latitude || !addressData?.longitude) {
      throw new Error('Dati di localizzazione mancanti. Assicurati di aver selezionato una città e un indirizzo validi.');
    }
    
    if (!reportForm.value.reportType || !reportForm.value.severity || !reportForm.value.description) {
      throw new Error('Compila tutti i campi obbligatori della segnalazione.');
    }
    
    if (reportForm.value.description.length < 10) {
      throw new Error('La descrizione deve essere di almeno 10 caratteri.');
    }
    
    if (showSubtype.value && !reportForm.value.reportSubtype) {
      throw new Error('Seleziona il sottotipo per questo tipo di segnalazione.');
    }
    
    if (showMissedCollectionDetails.value) {
      if (!reportForm.value.missedCollectionDetails.wasteType || !reportForm.value.missedCollectionDetails.scheduledDate) {
        throw new Error('Compila tutti i dettagli obbligatori per la raccolta saltata.');
      }
    }
    
    // Build location object for backend using BaseForm helper
    const locationData = baseFormRef.value?.buildLocationData();
    
    // Build API payload
    const reportPayload = {
      reportType: reportForm.value.reportType,
      severity: reportForm.value.severity,
      description: reportForm.value.description,
      location: locationData,
      images: reportForm.value.images
    };
    
    // Add optional fields based on report type
    if (showSubtype.value) {
      reportPayload.reportSubtype = reportForm.value.reportSubtype;
    }
    
    if (showMissedCollectionDetails.value) {
      reportPayload.missedCollectionDetails = reportForm.value.missedCollectionDetails;
    }
    
    if (showBinSelection.value && reportForm.value.relatedBin) {
      reportPayload.relatedBin = reportForm.value.relatedBin;
    }
    
    console.log('Sending API request...');
    console.log('Payload:', reportPayload);
    
    // Make API call
    let result;
    if (props.editMode && props.selectedReportId) {
      console.log('Updating report with ID:', props.selectedReportId);
      result = await reportsAPI.updateReport(props.selectedReportId, reportPayload);
      console.log('Report updated successfully:', result);
      
      // Emit success event
      emit('success', {
        type: 'update',
        message: 'Segnalazione aggiornata con successo!',
        report: result
      });
    } else {
      console.log('Creating new report...');
      result = await reportsAPI.createReport(reportPayload);
      console.log('Report created successfully:', result);
      
      // Emit success event
      emit('success', {
        type: 'create',
        message: 'Segnalazione creata con successo!',
        report: result
      });
    }
    
    // Reset form after successful operation
    resetForm();
    
  } catch (err) {
    console.error('Error in report form submission:', err);
    error.value = err.message || 'Errore durante l\'operazione. Riprova più tardi.';
    
    // Emit error event
    emit('error', {
      message: error.value,
      originalError: err
    });
    
  } finally {
    loading.value = false;
    emit('loading', false);
  }
}

//Force submit for external calls
function forceSubmit() {
  console.log('ReportForm forceSubmit called');
  handleSubmit();
}

//Handle form cancellation
function handleCancel() {
  console.log('ReportForm handleCancel called');
  resetForm();
  error.value = null;
  emit('cancel');
}

//Reset form to initial state
function resetForm() {
  reportForm.value = {
    reportType: '',
    reportSubtype: '',
    severity: 'BASSA',
    description: '',
    images: [],
    missedCollectionDetails: {
      wasteType: '',
      scheduledDate: '',
      area: ''
    },
    relatedBin: ''
  };
  baseFormRef.value?.resetAddressForm();
  error.value = null;
}

//Load report data for editing
function loadReportData(report) {
  if (!report) return;
  
  console.log('Loading report data for editing:', report);
  
  // Load report-specific data
  reportForm.value = {
    reportType: report.reportType || '',
    reportSubtype: report.reportSubtype || '',
    severity: report.severity || 'BASSA',
    description: report.description || '',
    images: report.images || [],
    missedCollectionDetails: report.missedCollectionDetails || {
      wasteType: '',
      scheduledDate: '',
      area: ''
    },
    relatedBin: report.relatedBin || ''
  };
  
  // Load address data through BaseForm
  baseFormRef.value?.loadAddressData(report);
  
  // Clear errors when loading new data
  error.value = null;
}

// Watch for changes in reportData prop
watch(() => props.reportData, (newReportData) => {
  if (newReportData && props.editMode) {
    loadReportData(newReportData);
  }
}, { immediate: true });

// Watch for changes in editMode
watch(() => props.editMode, (newEditMode) => {
  if (!newEditMode) {
    resetForm();
  }
});

//Expose methods for parent component access
defineExpose({ 
  resetForm, 
  handleSubmit, 
  forceSubmit,
  loadReportData, 
  getFormData: () => ({ 
    ...reportForm.value,
    ...(baseFormRef.value?.addressForm || {})
  }),
  formData: reportForm,
  loading,
  error
});
</script>

<template>
  <BaseForm 
    ref="baseFormRef"
    :editMode="editMode"
    formTitle="Segnalazione"
    createTitle="Nuova"
    editTitle="Modifica"
    @cancel="handleCancel"
  >
    <!-- Campi specifici per le segnalazioni -->
    <template #specific-fields>
      <!-- Error message display -->
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
      
      <div class="form-group">
        <label for="reportType">Tipo di segnalazione:</label>
        <select 
          id="reportType" 
          v-model="reportForm.reportType" 
          required
          :disabled="loading"
        >
          <option value="">Seleziona il tipo di segnalazione</option>
          <option v-for="type in reportTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>
      
      <div class="form-group" v-if="showSubtype">
        <label for="reportSubtype">Sottotipo:</label>
        <select 
          id="reportSubtype" 
          v-model="reportForm.reportSubtype" 
          :required="showSubtype"
          :disabled="loading"
        >
          <option value="">Seleziona il sottotipo</option>
          <option v-for="subtype in availableSubtypes" :key="subtype.value" :value="subtype.value">
            {{ subtype.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="severity">Gravità:</label>
        <select 
          id="severity" 
          v-model="reportForm.severity" 
          required
          :disabled="loading"
        >
          <option v-for="level in severityLevels" :key="level.value" :value="level.value">
            {{ level.label }}
          </option>
        </select>
      </div>

      <!-- Missed Collection Details -->
      <div class="missed-collection-details" v-if="showMissedCollectionDetails">
        <h4>Dettagli Raccolta Saltata</h4>
        
        <div class="form-group">
          <label for="wasteType">Tipo di rifiuto:</label>
          <select 
            id="wasteType" 
            v-model="reportForm.missedCollectionDetails.wasteType" 
            required
            :disabled="loading"
          >
            <option value="">Seleziona il tipo di rifiuto</option>
            <option v-for="waste in wasteTypes" :key="waste.value" :value="waste.value">
              {{ waste.label }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="scheduledDate">Data prevista raccolta:</label>
          <input 
            id="scheduledDate" 
            v-model="reportForm.missedCollectionDetails.scheduledDate" 
            type="date" 
            required 
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label for="area">Area/Zona:</label>
          <input 
            id="area" 
            v-model="reportForm.missedCollectionDetails.area" 
            type="text" 
            placeholder="Specificare l'area interessata"
            :disabled="loading"
          />
        </div>
      </div>

      <!-- Bin Selection for bin-related problems -->
      <div class="form-group" v-if="showBinSelection">
        <label for="relatedBin">Cestino interessato:</label>
        <input 
          id="relatedBin" 
          v-model="reportForm.relatedBin" 
          type="text" 
          placeholder="ID o codice del cestino (se noto)"
          :disabled="loading"
        />
      </div>
    </template>

    <!-- Campi aggiuntivi dopo l'indirizzo -->
    <template #additional-fields>
      <div class="form-group">
        <label for="description">Descrizione:</label>
        <textarea 
          id="description" 
          v-model="reportForm.description" 
          required 
          maxlength="1000"
          placeholder="Descrivi il problema (max 1000 caratteri)"
          rows="4"
          :disabled="loading"
        ></textarea>
        <small class="char-counter">{{ reportForm.description.length }}/1000 caratteri</small>
      </div>
    </template>

    <!-- Pulsanti del form -->
    <template #form-buttons>
      <div class="form-buttons">
        <button 
          type="button" 
          @click="handleCancel" 
          class="btn-cancel"
          :disabled="loading"
        >
          <i class="fas fa-times"></i> Annulla
        </button>
        <button 
          type="button" 
          @click="handleSubmit" 
          class="btn-submit"
          :disabled="loading"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ loading ? 'Salvando...' : (editMode ? 'Aggiorna' : 'Crea') }} Segnalazione
        </button>
      </div>
    </template>
  </BaseForm>
</template>

<style scoped>
.form-group {
  margin-bottom: 15px;
  position: relative;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

input:disabled, select:disabled, textarea:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

select {
  cursor: pointer;
}

select:disabled {
  cursor: not-allowed;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-message i {
  color: #e74c3c;
}

.missed-collection-details {
  background: #e8f5e8;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #4CAF50;
  margin: 15px 0;
}

.missed-collection-details h4 {
  margin: 0 0 15px 0;
  color: #2e7d32;
}

.char-counter {
  font-size: 11px;
  color: #888;
  float: right;
  margin-top: 4px;
}

.form-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.btn-cancel, .btn-submit {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #5a6268;
}

.btn-submit {
  background: #4CAF50;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #45a049;
}

.btn-cancel:disabled, .btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .form-buttons {
    flex-direction: column;
  }
}
</style> 