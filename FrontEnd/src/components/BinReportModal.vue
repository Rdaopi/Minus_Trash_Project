<template>
  <div v-if="show" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h3>Segnala Problema Cestino</h3>
        <button @click="closeModal" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="submitReport" class="modal-body">
        <!-- Bin Information -->
        <div v-if="bin" class="bin-info">
          <div class="bin-icon" :style="{ backgroundColor: getBinColor(bin.type) + '20' }">
            <i class="fas" :class="getBinIcon(bin.type)" :style="{ color: getBinColor(bin.type) }"></i>
          </div>
          <div class="bin-details">
            <h4>{{ bin.type || 'Cestino' }}</h4>
            <p class="bin-address">{{ formatBinAddress(bin) }}</p>
          </div>
        </div>

        <!-- Issue Type -->
        <div class="form-group">
          <label for="issueType">
            <i class="fas fa-exclamation-triangle"></i>
            Tipo di Problema *
          </label>
          <select 
            id="issueType" 
            v-model="formData.reportSubtype" 
            required
            class="form-control"
          >
            <option value="">Seleziona il tipo di problema</option>
            <option value="ROTTO">Cestino Rotto/Danneggiato</option>
            <option value="PIENO">Cestino Troppo Pieno</option>
            <option value="MANCANTE">Cestino Mancante</option>
            <option value="SPORCO">Cestino Sporco/Necessita Pulizia</option>
          </select>
        </div>

        <!-- Severity -->
        <div class="form-group">
          <label for="severity">
            <i class="fas fa-thermometer-half"></i>
            Gravità del Problema *
          </label>
          <select 
            id="severity" 
            v-model="formData.severity" 
            required
            class="form-control"
          >
            <option value="">Seleziona la gravità</option>
            <option value="BASSA">Bassa - Problema minore</option>
            <option value="MEDIA">Media - Richiede attenzione</option>
            <option value="ALTA">Alta - Problema significativo</option>
            <option value="URGENTE">Urgente - Richiede intervento immediato</option>
          </select>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description">
            <i class="fas fa-align-left"></i>
            Descrizione del Problema *
          </label>
          <textarea 
            id="description"
            v-model="formData.description"
            required
            maxlength="1000"
            rows="4"
            class="form-control"
            placeholder="Descrivi dettagliatamente il problema riscontrato..."
          ></textarea>
          <div v-if="formData.description && formData.description.length < 10" class="text-danger" style="margin-top: 0.5rem;">
            almeno 10 caratteri
          </div>
          <small class="char-counter">{{ formData.description.length }}/1000 caratteri</small>
        </div>

        <!-- Additional Info for Missing Bin -->
        <div v-if="formData.reportSubtype === 'MANCANTE'" class="form-group">
          <label for="additionalInfo">
            <i class="fas fa-info-circle"></i>
            Informazioni Aggiuntive
          </label>
          <textarea 
            id="additionalInfo"
            v-model="formData.additionalInfo"
            rows="2"
            class="form-control"
            placeholder="Quando hai notato che il cestino mancava? Era presente in precedenza?"
          ></textarea>
        </div>

        <!-- Contact Info Notice -->
        <div class="contact-notice">
          <i class="fas fa-info-circle"></i>
          <p>La segnalazione verrà inviata con i tuoi dati di contatto per eventuali aggiornamenti.</p>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Success Message -->
        <div v-if="success" class="success-message">
          <i class="fas fa-check-circle"></i>
          <span>{{ success }}</span>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="closeModal" class="cancel-button" :disabled="loading">
            <i class="fas fa-times"></i>
            Annulla
          </button>
          <button type="submit" class="submit-button" :disabled="loading || !isFormValid">
            <i class="fas fa-paper-plane" :class="{ 'fa-spin': loading }"></i>
            {{ loading ? 'Invio in corso...' : 'Invia Segnalazione' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { reportsAPI } from '../services/api';
import { useBinUtils } from '../composables/useBinUtils';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  bin: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'success']);

// Use utility composables
const { getBinIcon, getBinColor, formatBinAddress } = useBinUtils();

// Form data
const formData = ref({
  reportSubtype: '',
  severity: '',
  description: '',
  additionalInfo: ''
});

// State
const loading = ref(false);
const error = ref(null);
const success = ref(null);

// Computed
const isFormValid = computed(() => {
  return formData.value.reportSubtype && 
         formData.value.severity && 
         formData.value.description.trim().length >= 10;
});

// Watch for modal show/hide to reset form
watch(() => props.show, (newValue) => {
  if (newValue) {
    resetForm();
  } else {
    // Also reset when modal is hidden
    setTimeout(() => {
      resetForm();
    }, 300); // Wait for modal animation to complete
  }
});

// Watch for bin changes to reset form
watch(() => props.bin, () => {
  if (props.show) {
    resetForm();
  }
});

// Methods
const resetForm = () => {
  formData.value = {
    reportSubtype: '',
    severity: '',
    description: '',
    additionalInfo: ''
  };
  error.value = null;
  success.value = null;
  loading.value = false;
};

const closeModal = () => {
  emit('close');
};

const submitReport = async () => {
  if (!isFormValid.value || loading.value) return;

  loading.value = true;
  error.value = null;

  try {
    // Get the formatted address from the bin
    const fullAddress = formatBinAddress(props.bin);
    
    // Try to parse the address into components
    let addressObject = {};
    if (fullAddress && fullAddress !== 'Indirizzo non disponibile') {
      // Simple parsing - try to extract street and number
      const addressParts = fullAddress.split(',').map(part => part.trim());
      if (addressParts.length > 0) {
        const firstPart = addressParts[0];
        // Try to separate street and number
        const streetNumberMatch = firstPart.match(/^(.+?)(?:\s+(\d+.*))?$/);
        if (streetNumberMatch) {
          addressObject.street = streetNumberMatch[1]?.trim() || firstPart;
          addressObject.number = streetNumberMatch[2]?.trim() || '';
        } else {
          addressObject.street = firstPart;
        }
        
        // Add city if available
        if (addressParts.length > 1) {
          addressObject.city = addressParts[1];
        }
        
        // Add postal code if available
        if (addressParts.length > 2) {
          addressObject.postalCode = addressParts[2];
        }
      }
    }

    // Prepare report data
    const reportData = {
      reportType: 'PROBLEMA_CESTINO',
      reportSubtype: formData.value.reportSubtype,
      severity: formData.value.severity,
      description: formData.value.description + 
        (formData.value.additionalInfo ? `\n\nInformazioni aggiuntive: ${formData.value.additionalInfo}` : ''),
      location: {
        type: 'Point',
        coordinates: [
          props.bin.lng || (props.bin.location?.coordinates?.[0]),
          props.bin.lat || (props.bin.location?.coordinates?.[1])
        ],
        address: addressObject
      }
    };

    // Add relatedBin only if not missing
    if (formData.value.reportSubtype !== 'MANCANTE') {
      reportData.relatedBin = props.bin.id || props.bin._id;
    }

    // Submit report
    const response = await reportsAPI.createReport(reportData);
    
    success.value = 'Segnalazione inviata con successo!';
    
    // Emit success immediately and close modal
    emit('success', response);
    
    // Close modal after short delay to show success message
    setTimeout(() => {
      closeModal();
    }, 1500);

  } catch (err) {
    console.error('Error submitting report:', err);
    error.value = err.message || 'Errore durante l\'invio della segnalazione. Riprova più tardi.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
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
  margin: 0;
  color: #6b7280;
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

.form-control:invalid {
  border-color: #ef4444;
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.char-counter {
  display: block;
  text-align: right;
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 4px;
}

.contact-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.contact-notice i {
  color: #0ea5e9;
  margin-top: 2px;
  flex-shrink: 0;
}

.contact-notice p {
  margin: 0;
  color: #0c4a6e;
  font-size: 0.85rem;
  line-height: 1.4;
}

.error-message, .success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
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

/* Responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-container {
    border-radius: 12px;
  }
  
  .modal-header, .modal-body {
    padding: 16px;
  }
  
  .bin-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 