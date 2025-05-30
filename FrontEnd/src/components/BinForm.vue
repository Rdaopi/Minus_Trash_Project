//Reusable form component for bin creation and editing
<script setup>
import { ref, defineEmits, defineProps, watch } from 'vue';
import BaseForm from './BaseForm.vue';

// Variables for the update bin form management
const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  binData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['submit', 'cancel']);

// Reference to BaseForm component
const baseFormRef = ref(null);

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

//Handle form submission
function handleSubmit() {
  console.log('=== BIN FORM HANDLE SUBMIT ===');
  console.log('BinForm handleSubmit called');
  console.log('Bin form data:', binForm.value);
  console.log('Address form data:', baseFormRef.value?.addressForm);
  console.log('Edit mode:', props.editMode);
  console.log('About to emit submit event...');
  
  // Combine bin-specific data with address data
  const dataToEmit = {
    ...binForm.value,
    ...baseFormRef.value.addressForm
  };
  
  console.log('Data being emitted:', dataToEmit);
  emit('submit', dataToEmit);
  console.log('Submit event emitted successfully');
}

//Force submit for external calls
function forceSubmit() {
  console.log('BinForm forceSubmit called');
  handleSubmit();
}

//Handle form cancellation
function handleCancel() {
  resetForm();
  baseFormRef.value?.handleCancel();
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
  formData: binForm
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
      <div class="form-group">
        <label for="serialNumber">Serial Number:</label>
        <input 
          id="serialNumber" 
          v-model="binForm.serialNumber" 
          type="text" 
          required 
          minlength="6"
          placeholder="Almeno 6 caratteri"
        />
        <small v-if="binForm.serialNumber && binForm.serialNumber.length < 6" class="validation-hint">
          Il numero seriale deve essere lungo almeno 6 caratteri
        </small>
      </div>
      
      <div class="form-group">
        <label for="manufacturer">Produttore:</label>
        <input id="manufacturer" v-model="binForm.manufacturer" type="text" required />
      </div>
      
      <div class="form-group">
        <label for="type">Tipo rifiuto:</label>
        <select id="type" v-model="binForm.type" required>
          <option value="">Seleziona tipo</option>
          <option v-for="type in binTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="capacity">Capacità (litri):</label>
        <input id="capacity" v-model.number="binForm.capacity" type="number" min="1" required />
      </div>
      
      <div class="form-group">
        <label for="installationDate">Data di installazione:</label>
        <input id="installationDate" v-model="binForm.installationDate" type="date" required />
      </div>
    </template>

    <!-- Pulsanti del form -->
    <template #form-buttons>
      <div class="form-buttons">
        <button type="button" @click="handleCancel" class="btn-cancel">
          <i class="fas fa-times"></i> Annulla
        </button>
        <button type="button" @click="handleSubmit" class="btn-submit">
          <i class="fas fa-save"></i> {{ editMode ? 'Aggiorna' : 'Crea' }} Cestino
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

select {
  cursor: pointer;
}

.validation-hint {
  display: block;
  font-size: 11px;
  color: #e74c3c;
  margin-top: 4px;
  font-style: italic;
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