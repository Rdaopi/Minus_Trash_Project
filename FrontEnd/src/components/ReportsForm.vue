//Reusable form component for report creation and editing
<script setup>
import { ref, defineEmits, defineProps, watch, computed } from 'vue';
import BaseForm from './BaseForm.vue';

// Variables for the report form management
const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  reportData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['submit', 'cancel']);

// Reference to BaseForm component
const baseFormRef = ref(null);

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

//Handle form submission
function handleSubmit() {
  console.log('=== REPORT FORM HANDLE SUBMIT ===');
  console.log('ReportForm handleSubmit called');
  console.log('Report form data:', reportForm.value);
  console.log('Address form data:', baseFormRef.value?.addressForm);
  console.log('Edit mode:', props.editMode);
  console.log('About to emit submit event...');
  
  // Build location object for backend using BaseForm helper
  const locationData = baseFormRef.value?.buildLocationData();
  
  // Build data object matching backend model
  const dataToEmit = {
    reportType: reportForm.value.reportType,
    severity: reportForm.value.severity,
    description: reportForm.value.description,
    location: locationData,
    images: reportForm.value.images
  };
  
  // Add optional fields based on report type
  if (showSubtype.value) {
    dataToEmit.reportSubtype = reportForm.value.reportSubtype;
  }
  
  if (showMissedCollectionDetails.value) {
    dataToEmit.missedCollectionDetails = reportForm.value.missedCollectionDetails;
  }
  
  if (showBinSelection.value && reportForm.value.relatedBin) {
    dataToEmit.relatedBin = reportForm.value.relatedBin;
  }
  
  console.log('Data being emitted:', dataToEmit);
  emit('submit', dataToEmit);
  console.log('Submit event emitted successfully');
}

//Force submit for external calls
function forceSubmit() {
  console.log('ReportForm forceSubmit called');
  handleSubmit();
}

//Handle form cancellation
function handleCancel() {
  resetForm();
  baseFormRef.value?.handleCancel();
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
  formData: reportForm
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
      <div class="form-group">
        <label for="reportType">Tipo di segnalazione:</label>
        <select 
          id="reportType" 
          v-model="reportForm.reportType" 
          required
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
          />
        </div>
        
        <div class="form-group">
          <label for="area">Area/Zona:</label>
          <input 
            id="area" 
            v-model="reportForm.missedCollectionDetails.area" 
            type="text" 
            placeholder="Specificare l'area interessata"
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
        ></textarea>
        <small class="char-counter">{{ reportForm.description.length }}/1000 caratteri</small>
      </div>
    </template>

    <!-- Pulsanti del form -->
    <template #form-buttons>
      <div class="form-buttons">
        <button type="button" @click="handleCancel" class="btn-cancel">
          <i class="fas fa-times"></i> Annulla
        </button>
        <button type="button" @click="handleSubmit" class="btn-submit">
          <i class="fas fa-save"></i> {{ editMode ? 'Aggiorna' : 'Crea' }} Segnalazione
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

textarea {
  resize: vertical;
  min-height: 80px;
}

select {
  cursor: pointer;
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

.btn-cancel:hover {
  background: #5a6268;
}

.btn-submit {
  background: #4CAF50;
  color: white;
}

.btn-submit:hover {
  background: #45a049;
}

@media (max-width: 768px) {
  .form-buttons {
    flex-direction: column;
  }
}
</style> 