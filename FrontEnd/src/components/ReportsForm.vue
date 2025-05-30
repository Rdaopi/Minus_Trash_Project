//Reusable form component for report creation and editing
<script setup>
import { ref, defineEmits, defineProps, watch, onMounted, computed } from 'vue';

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

//Form data reactive object
const reportForm = ref({
  reportType: '',
  reportSubtype: '',
  severity: 'BASSA',
  description: '',
  images: [],
  // Location data
  address: '',
  street: '',
  streetNumber: '',
  city: '',
  cap: '',
  latitude: '',
  longitude: '',
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

//Address autocomplete state management
const suggestions = ref([]);
const showSuggestions = ref(false);
const loadingSuggestions = ref(false);

//City autocomplete state management (separate from address)
const citySuggestions = ref([]);
const showCitySuggestions = ref(false);
const loadingCitySuggestions = ref(false);

//Debounce timers for API calls
let cityDebounceTimer = null;
let addressDebounceTimer = null;

//Fetch address suggestions from Nominatim API
async function fetchSuggestions(query) {
  console.log('Fetching address suggestions for:', query, 'in city:', reportForm.value.city);
  
  if (!query || query.length < 3) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  
  if (!reportForm.value.city) {
    console.log('No city selected, cannot search for addresses');
    return;
  }
  
  loadingSuggestions.value = true;
  
  try {
    //Build search query with city context
    const cityQuery = `${query}, ${reportForm.value.city}`;
    const url = `/nominatim/search?format=json&q=${encodeURIComponent(cityQuery)}&addressdetails=1&limit=10&countrycodes=it`;
    console.log('Address API URL:', url);
    
    const res = await fetch(url);
    const data = await res.json();
    console.log('Address API response:', data);
    console.log('Raw data length:', data.length);
    
    //Debug logging for first few items
    if (data.length > 0) {
      console.log('First result sample:', data[0]);
      console.log('First result address:', data[0].address);
    }
    
    //Filter results to include only valid addresses
    const addressResults = data.filter(item => {
      return item.address && (item.address.road || item.address.house_number || item.display_name.includes(query));
    });
    
    console.log('Filtered address results:', addressResults);
    console.log('Filtered results length:', addressResults.length);
    
    suggestions.value = addressResults;
    showSuggestions.value = addressResults.length > 0;
    
  } catch (e) {
    console.error('Error fetching address suggestions:', e);
    suggestions.value = [];
    showSuggestions.value = false;
  } finally {
    loadingSuggestions.value = false;
  }
}

//Fetch city suggestions from Nominatim API
async function fetchCitySuggestions(query) {
  console.log('Fetching city suggestions for:', query);
  
  if (!query || query.length < 2) {
    citySuggestions.value = [];
    showCitySuggestions.value = false;
    console.log('Query too short, clearing suggestions');
    return;
  }
  
  loadingCitySuggestions.value = true;
  
  try {
    //Search for Italian cities with simplified approach
    const url = `/nominatim/search?format=json&q=${encodeURIComponent(query + ', Italia')}&addressdetails=1&limit=8&countrycodes=it`;
    console.log('City API URL:', url);
    
    const res = await fetch(url);
    const data = await res.json();
    console.log('City API response:', data);
    
    //Filter for actual cities/towns and format results
    const cityResults = data.filter(item => {
      //Look for places that are cities, towns, or villages
      const hasCity = item.address && (item.address.city || item.address.town || item.address.village);
      const isPlace = item.class === 'place' || item.type === 'administrative';
      return hasCity && isPlace;
    }).map(item => ({
      ...item,
      displayName: item.address?.city || item.address?.town || item.address?.village,
      region: item.address?.state || item.address?.region || '',
      postcode: item.address?.postcode || ''
    }));
    
    console.log('Filtered city results:', cityResults);
    citySuggestions.value = cityResults;
    showCitySuggestions.value = cityResults.length > 0;
    
  } catch (e) {
    console.error('Error fetching city suggestions:', e);
    citySuggestions.value = [];
    showCitySuggestions.value = false;
  } finally {
    loadingCitySuggestions.value = false;
  }
}

//Handle city input with debouncing
function handleCityInput(e) {
  const query = e.target.value;
  reportForm.value.city = query;
  
  //Clear previous timer
  if (cityDebounceTimer) {
    clearTimeout(cityDebounceTimer);
  }
  
  //Debounce the API call
  cityDebounceTimer = setTimeout(() => {
    fetchCitySuggestions(query);
  }, 300);
}

//Parse address details from geocoding response
function parseAddress(addressDetails) {
  if (!addressDetails) return;
  
  //Extract address components
  reportForm.value.street = addressDetails.road || '';
  reportForm.value.streetNumber = addressDetails.house_number || '';
  reportForm.value.city = addressDetails.city || addressDetails.town || addressDetails.village || '';
  reportForm.value.cap = addressDetails.postcode || '';
}

//Handle address input with debouncing
function handleAddressInput(e) {
  const query = e.target.value;
  reportForm.value.address = query;
  
  //Clear previous timer
  if (addressDebounceTimer) {
    clearTimeout(addressDebounceTimer);
  }
  
  //Debounce the API call
  addressDebounceTimer = setTimeout(() => {
    fetchSuggestions(query);
  }, 300);
}

//Handle city suggestion selection
function selectCitySuggestion(s) {
  console.log('Selected city suggestion:', s);
  
  //Use the formatted display name
  reportForm.value.city = s.displayName;
  
  //Update postal code if available
  if (s.postcode) {
    reportForm.value.cap = s.postcode;
    console.log('Updated CAP to:', s.postcode);
  }
  
  //Clear suggestions with timeout
  setTimeout(() => {
    showCitySuggestions.value = false;
    citySuggestions.value = [];
  }, 100);
  
  //Clear address field since city changed
  reportForm.value.address = '';
  reportForm.value.street = '';
  reportForm.value.streetNumber = '';
  reportForm.value.latitude = '';
  reportForm.value.longitude = '';
}

//Handle address suggestion selection
function selectSuggestion(s) {
  console.log('Selected address suggestion:', s);
  reportForm.value.address = s.display_name;
  reportForm.value.latitude = s.lat;
  reportForm.value.longitude = s.lon;
  parseAddress(s.address);
  
  //Clear suggestions with timeout
  setTimeout(() => {
    showSuggestions.value = false;
    suggestions.value = [];
  }, 100);
}

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
  console.log('Form data:', reportForm.value);
  console.log('Edit mode:', props.editMode);
  console.log('About to emit submit event...');
  
  // Build location object for backend
  const locationData = {
    type: 'Point',
    coordinates: [parseFloat(reportForm.value.longitude), parseFloat(reportForm.value.latitude)],
    address: {
      street: reportForm.value.street,
      number: reportForm.value.streetNumber,
      city: reportForm.value.city,
      postalCode: reportForm.value.cap
    }
  };
  
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
    address: '',
    street: '',
    streetNumber: '',
    city: '',
    cap: '',
    latitude: '',
    longitude: '',
    missedCollectionDetails: {
      wasteType: '',
      scheduledDate: '',
      area: ''
    },
    relatedBin: ''
  };
  suggestions.value = [];
  showSuggestions.value = false;
  citySuggestions.value = [];
  showCitySuggestions.value = false;
}

//Load report data for editing
function loadReportData(report) {
  if (!report) return;
  
  console.log('Loading report data for editing:', report);
  
  // Helper function to safely extract address string
  const extractAddress = (report) => {
    // If report.address exists and is a string
    if (report.address && typeof report.address === 'string') {
      return report.address;
    }
    
    // If report.location.address exists
    if (report.location && report.location.address) {
      if (typeof report.location.address === 'string') {
        return report.location.address;
      }
      
      // If it's an object, construct the address string
      if (typeof report.location.address === 'object' && report.location.address !== null) {
        const addr = report.location.address;
        const parts = [];
        
        if (addr.street) parts.push(addr.street);
        if (addr.number) parts.push(addr.number);
        if (addr.city) parts.push(addr.city);
        if (addr.postalCode) parts.push(addr.postalCode);
        
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    }
    
    // Fallback to coordinates if available
    const lat = report.lat || report.latitude || (report.location?.coordinates?.[1]);
    const lng = report.lng || report.longitude || (report.location?.coordinates?.[0]);
    if (lat && lng) {
      return `Coordinate: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    
    return '';
  };
  
  reportForm.value = {
    reportType: report.reportType || '',
    reportSubtype: report.reportSubtype || '',
    severity: report.severity || 'BASSA',
    description: report.description || '',
    images: report.images || [],
    address: extractAddress(report),
    street: report.location?.address?.street || '',
    streetNumber: report.location?.address?.number || '',
    city: report.location?.address?.city || '',
    cap: report.location?.address?.postalCode || '',
    latitude: report.location?.coordinates?.[1] || '',
    longitude: report.location?.coordinates?.[0] || '',
    missedCollectionDetails: report.missedCollectionDetails || {
      wasteType: '',
      scheduledDate: '',
      area: ''
    },
    relatedBin: report.relatedBin || ''
  };
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
  getFormData: () => ({ ...reportForm.value }),
  formData: reportForm
});
</script>

<template>
  <form @submit.prevent="handleSubmit" class="report-form" autocomplete="off">
    <div class="form-header" v-if="editMode">
      <h3><i class="fas fa-edit"></i> Modifica Segnalazione</h3>
    </div>
    <div class="form-header" v-else>
      <h3><i class="fas fa-plus"></i> Nuova Segnalazione</h3>
    </div>
    
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
    
    <div class="form-group">
      <label for="city">Città:</label>
      <input 
        id="city" 
        v-model="reportForm.city" 
        type="text" 
        required 
        placeholder="Inserisci la città" 
        @input="handleCityInput"
      />
      <div v-if="loadingCitySuggestions" class="suggestions-loading">Caricamento città...</div>
      <ul v-if="showCitySuggestions && citySuggestions.length" class="suggestions-list city-suggestions">
        <li v-for="s in citySuggestions" :key="s.place_id" @click.prevent="selectCitySuggestion(s)">
          <strong>{{ s.displayName }}</strong>
          <span class="suggestion-details" v-if="s.region">{{ s.region }}</span>
          <span class="suggestion-details" v-if="s.postcode">CAP: {{ s.postcode }}</span>
        </li>
      </ul>
    </div>
    
    <div class="form-group address-group">
      <label for="address">Indirizzo:</label>
      <input 
        id="address" 
        v-model="reportForm.address" 
        type="text" 
        @input="handleAddressInput" 
        :disabled="!reportForm.city" 
        required 
        autocomplete="off"
        placeholder="Inizia a digitare per cercare..."
      />
      <div v-if="loadingSuggestions" class="suggestions-loading">Caricamento indirizzi...</div>
      <ul v-if="showSuggestions && suggestions.length" class="suggestions-list">
        <li v-for="s in suggestions" :key="s.place_id" @click.prevent="selectSuggestion(s)">
          <strong>{{ s.address?.road || 'Via' }} {{ s.address?.house_number || '' }}</strong>
          <span class="suggestion-details">{{ s.address?.city || s.address?.town }}, {{ s.address?.postcode }}</span>
        </li>
      </ul>
    </div>

    <!-- 2x2 grid for address details -->
    <div class="address-details-grid">
      <div class="form-group">
        <label for="street-readonly">Via:</label>
        <input id="street-readonly" v-model="reportForm.street" type="text" readonly />
      </div>
      
      <div class="form-group">
        <label for="streetNumber-readonly">Numero Civico:</label>
        <input id="streetNumber-readonly" v-model="reportForm.streetNumber" type="text" readonly />
      </div>
      
      <div class="form-group">
        <label for="city-readonly">Città:</label>
        <input id="city-readonly" v-model="reportForm.city" type="text" readonly />
      </div>
      
      <div class="form-group">
        <label for="cap-readonly">CAP:</label>
        <input id="cap-readonly" v-model="reportForm.cap" type="text" readonly />
      </div>
    </div>

    <!-- Coordinates display -->
    <div class="coordinates-group">
      <div class="form-group">
        <label for="latitude-readonly">Latitudine:</label>
        <input id="latitude-readonly" v-model="reportForm.latitude" type="text" readonly />
      </div>
      
      <div class="form-group">
        <label for="longitude-readonly">Longitudine:</label>
        <input id="longitude-readonly" v-model="reportForm.longitude" type="text" readonly />
      </div>
    </div>

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

    <div class="form-buttons">
      <button type="button" @click="handleCancel" class="btn-cancel">
        <i class="fas fa-times"></i> Annulla
      </button>
      <button type="submit" class="btn-submit">
        <i class="fas fa-save"></i> {{ editMode ? 'Aggiorna' : 'Crea' }} Segnalazione
      </button>
    </div>
  </form>
</template>

<style scoped>
.report-form {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

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

textarea {
  resize: vertical;
  min-height: 80px;
}

input[readonly] {
  background: #e9e9e9;
  color: #666;
  cursor: not-allowed;
}

.address-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin: 15px 0;
}

.coordinates-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin: 15px 0;
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

.suggestions-list {
  position: absolute;
  z-index: 10;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  max-height: 150px;
  overflow-y: auto;
  margin-top: 2px;
  list-style: none;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.city-suggestions {
  border-color: #4CAF50;
}

.suggestions-list li {
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid #f0f0f0;
}

.suggestions-list li:last-child {
  border-bottom: none;
}

.suggestions-list li:hover {
  background: #f0f0f0;
}

.city-suggestions li:hover {
  background: rgba(76, 175, 80, 0.1);
}

.suggestion-details {
  font-size: 11px;
  color: #888;
  font-style: italic;
}

.suggestions-loading {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
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
  .address-details-grid,
  .coordinates-group {
    grid-template-columns: 1fr;
  }
  
  .form-buttons {
    flex-direction: column;
  }
}

.form-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4CAF50;
}

.form-header h3 {
  margin: 0;
  color: #4CAF50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-header i {
  font-size: 1.2rem;
}
</style> 