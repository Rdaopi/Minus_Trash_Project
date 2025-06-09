//Reusable form component for bin creation and editing
<script setup>
import { ref, defineEmits, defineProps, watch } from 'vue';
import BaseForm from './BaseForm.vue';
import { binsAPI } from '../services/api';

// Variables for the update bin form management
const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  binData: {
    type: Object,
    default: null
  },
  selectedBinId: {
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

//Form data reactive object (only bin-specific fields)
const binForm = ref({
  serialNumber: '',
  manufacturer: '',
  type: '',
  capacity: null,
  installationDate: new Date().toISOString().split('T')[0] //Current date as default
});

//Waste types matching icons/colors in app
const binTypes = [
  { value: 'PLASTICA', label: 'Plastica' },
  { value: 'CARTA', label: 'Carta' },
  { value: 'VETRO', label: 'Vetro' },
  { value: 'INDIFFERENZIATO', label: 'Indifferenziato' },
  { value: 'ORGANICO', label: 'Organico' },
  { value: 'RAEE', label: 'RAEE' }
];

// Prevent 'e' and 'E' in number input
function preventInvalidChars(e) {
  if (e.key === 'e' || e.key === 'E'|| e.key === '+' || e.key === '-') {
    e.preventDefault();
  }
}

//Handle form submission with API calls
async function handleSubmit() {
  console.log('=== BIN FORM HANDLE SUBMIT ===');
  console.log('BinForm handleSubmit called');
  console.log('Bin form data:', binForm.value);
  console.log('Address form data:', baseFormRef.value?.addressForm);
  console.log('Edit mode:', props.editMode);
  console.log('Selected bin ID:', props.selectedBinId);
  
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
    
    if (!binForm.value.type || !binForm.value.capacity || !binForm.value.serialNumber || !binForm.value.manufacturer) {
      throw new Error('Compila tutti i campi obbligatori del cestino.');
    }
    
    if (binForm.value.serialNumber.length < 6) {
      throw new Error('Il numero seriale deve essere lungo almeno 6 caratteri.');
    }
    
    if (!Number.isInteger(parseInt(binForm.value.capacity)) || parseInt(binForm.value.capacity) < 1 || parseInt(binForm.value.capacity) > 5000) {
      throw new Error('La capacità deve essere un numero intero tra 1 e 5000.');
    }
    
    // Build API payload
    const binPayload = {
      type: binForm.value.type,
      capacity: parseInt(binForm.value.capacity),
      serialNumber: binForm.value.serialNumber,
      manufacturer: binForm.value.manufacturer,
      installationDate: binForm.value.installationDate,
      location: {
        type: 'Point',
        coordinates: [parseFloat(addressData.longitude), parseFloat(addressData.latitude)],
        address: {
          street: addressData.street || '',
          streetNumber: addressData.streetNumber || '',
          city: addressData.city,
          postalCode: addressData.cap || '',
          country: 'Italia'
        }
      }
    };
    
    console.log('Sending API request...');
    console.log('Payload:', binPayload);
    
    // Make API call
    let result;
    if (props.editMode && props.selectedBinId) {
      console.log('Updating bin with ID:', props.selectedBinId);
      result = await binsAPI.updateBin(props.selectedBinId, binPayload);
      console.log('Bin updated successfully:', result);
      
      // Emit success event
      emit('success', {
        type: 'update',
        message: 'Cestino aggiornato con successo!',
        bin: result
      });
    } else {
      console.log('Creating new bin...');
      result = await binsAPI.createBin(binPayload);
      console.log('Bin created successfully:', result);
      
      // Emit success event
      emit('success', {
        type: 'create', 
        message: 'Cestino creato con successo!',
        bin: result
      });
    }
    
    // Reset form after successful operation
    resetForm();
    
  } catch (err) {
    console.error('Error in bin form submission:', err);
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
  console.log('BinForm forceSubmit called');
  handleSubmit();
}

//Handle form cancellation
function handleCancel() {
  console.log('BinForm handleCancel called');
  resetForm();
  error.value = null;
  emit('cancel');
}

//Reset form to initial state
function resetForm() {
  binForm.value = {
    serialNumber: '',
    manufacturer: '',
    type: '',
    capacity: null,
    installationDate: new Date().toISOString().split('T')[0]
  };
  baseFormRef.value?.resetAddressForm();
  error.value = null;
}

//Load bin data for editing
function loadBinData(bin) {
  if (!bin) return;
  
  console.log('Loading bin data for editing:', bin);
  
  // Load bin-specific data
  binForm.value = {
    serialNumber: bin.serialNumber || '',
    manufacturer: bin.manufacturer || '',
    type: bin.type || '',
    capacity: bin.capacity || null,
    installationDate: bin.installationDate ? bin.installationDate.split('T')[0] : new Date().toISOString().split('T')[0]
  };
  
  // Load address data through BaseForm
  baseFormRef.value?.loadAddressData(bin);
  
  // Clear errors when loading new data
  error.value = null;
}

// Watch for changes in binData prop
watch(() => props.binData, (newBinData) => {
  if (newBinData && props.editMode) {
    loadBinData(newBinData);
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
  loadBinData, 
  getFormData: () => ({ 
    ...binForm.value, 
    ...(baseFormRef.value?.addressForm || {})
  }),
  formData: binForm,
  loading,
  error
});
</script>

<template>
  <BaseForm 
    ref="baseFormRef"
    :editMode="editMode"
    formTitle="Cestino"
    createTitle="Nuovo"
    editTitle="Modifica"
    @cancel="handleCancel"
  >
    <!-- Campi specifici per i bin -->
    <template #specific-fields>
      <!-- Error message display -->
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
      
      <div class="form-group">
        <label for="serialNumber">Serial Number:</label>
        <input 
          id="serialNumber" 
          v-model="binForm.serialNumber" 
          type="text" 
          required 
          minlength="6"
          placeholder="Almeno 6 caratteri"
          :disabled="loading"
        />
        <small v-if="binForm.serialNumber && binForm.serialNumber.length < 6" class="validation-hint">
          Il numero seriale deve essere lungo almeno 6 caratteri
        </small>
      </div>
      
      <div class="form-group">
        <label for="manufacturer">Produttore:</label>
        <input 
          id="manufacturer" 
          v-model="binForm.manufacturer" 
          type="text" 
          required 
          :disabled="loading"
        />
      </div>
      
      <div class="form-group">
        <label for="type">Tipo rifiuto:</label>
        <select 
          id="type" 
          v-model="binForm.type" 
          required
          :disabled="loading"
        >
          <option value="">Seleziona tipo</option>
          <option v-for="type in binTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="capacity">Capacità (litri):</label>
        <input 
          id="capacity" 
          v-model.number="binForm.capacity" 
          type="number" 
          min="1" 
          max="5000"
          required 
          :disabled="loading"
          @keydown="preventInvalidChars"  
        />
      </div>
      
      <div class="form-group">
        <label for="installationDate">Data di installazione:</label>
        <input 
          id="installationDate" 
          v-model="binForm.installationDate" 
          type="date" 
          required 
          :disabled="loading"
        />
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
          {{ loading ? 'Salvando...' : (editMode ? 'Aggiorna' : 'Crea') }} Cestino
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

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

input:focus, select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

input:disabled, select:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

select {
  cursor: pointer;
}

select:disabled {
  cursor: not-allowed;
}

.validation-hint {
  display: block;
  font-size: 11px;
  color: #e74c3c;
  margin-top: 4px;
  font-style: italic;
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