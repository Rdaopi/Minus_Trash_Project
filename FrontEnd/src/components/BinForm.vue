//Reusable form component for bin creation and editing
<script setup>
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['submit', 'cancel']);

//Form data reactive object
const binForm = ref({
  serialNumber: '',
  manufacturer: '',
  type: '',
  capacity: null,
  address: '',
  //Read-only address fields populated by geocoding
  street: '',
  streetNumber: '',
  city: '',
  cap: '',
  latitude: '',
  longitude: '',
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
  console.log('Fetching address suggestions for:', query, 'in city:', binForm.value.city);
  
  if (!query || query.length < 3) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  
  if (!binForm.value.city) {
    console.log('No city selected, cannot search for addresses');
    return;
  }
  
  loadingSuggestions.value = true;
  
  try {
    //Build search query with city context
    const cityQuery = `${query}, ${binForm.value.city}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}&addressdetails=1&limit=10&countrycodes=it`;
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
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Italia')}&addressdetails=1&limit=8&countrycodes=it`;
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
  binForm.value.city = query;
  
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
  binForm.value.street = addressDetails.road || '';
  binForm.value.streetNumber = addressDetails.house_number || '';
  binForm.value.city = addressDetails.city || addressDetails.town || addressDetails.village || '';
  binForm.value.cap = addressDetails.postcode || '';
}

//Handle address suggestion selection
function selectSuggestion(s) {
  binForm.value.address = s.display_name;
  binForm.value.latitude = s.lat;
  binForm.value.longitude = s.lon;
  parseAddress(s.address);
  showSuggestions.value = false;
}

//Handle address input with debouncing
function handleAddressInput(e) {
  const query = e.target.value;
  binForm.value.address = query;
  
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
  binForm.value.city = s.displayName;
  
  //Update postal code if available
  if (s.postcode) {
    binForm.value.cap = s.postcode;
    console.log('Updated CAP to:', s.postcode);
  }
  
  //Clear suggestions
  showCitySuggestions.value = false;
  citySuggestions.value = [];
  
  //Clear address field since city changed
  binForm.value.address = '';
  binForm.value.street = '';
  binForm.value.streetNumber = '';
  binForm.value.latitude = '';
  binForm.value.longitude = '';
}

//Handle form submission
function handleSubmit() {
  console.log('BinForm handleSubmit called');
  console.log('Form data:', binForm.value);
  emit('submit', { ...binForm.value });
  console.log('Submit event emitted');
}

//Handle form cancellation
function handleCancel() {
  resetForm();
  emit('cancel');
}

//Reset form to initial state
function resetForm() {
  binForm.value = {
    serialNumber: '',
    manufacturer: '',
    type: '',
    capacity: null,
    address: '',
    street: '',
    streetNumber: '',
    city: '',
    cap: '',
    latitude: '',
    longitude: '',
    installationDate: new Date().toISOString().split('T')[0]
  };
  suggestions.value = [];
  showSuggestions.value = false;
  citySuggestions.value = [];
  showCitySuggestions.value = false;
}

//Expose methods for parent component access
defineExpose({ resetForm, handleSubmit });
</script>

<template>
  <form @submit.prevent="handleSubmit" class="bin-form" autocomplete="off">
    <div class="form-group">
      <label for="serialNumber">Serial Number:</label>
      <input id="serialNumber" v-model="binForm.serialNumber" type="text" required />
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
    
    <div class="form-group">
      <label for="city">Città:</label>
      <input id="city" v-model="binForm.city" type="text" required placeholder="Inserisci la città" @input="handleCityInput" />
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
        v-model="binForm.address" 
        type="text" 
        @input="handleAddressInput" 
        :disabled="!binForm.city" 
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
        <label for="street">Via:</label>
        <input id="street" v-model="binForm.street" type="text" readonly />
      </div>
      
      <div class="form-group">
        <label for="streetNumber">Numero Civico:</label>
        <input id="streetNumber" v-model="binForm.streetNumber" type="text" readonly />
      </div>
      
      <div class="form-group">
        <label for="city">Città:</label>
        <input id="city" v-model="binForm.city" type="text" readonly />
      </div>
      
      <div class="form-group">
        <label for="cap">CAP:</label>
        <input id="cap" v-model="binForm.cap" type="text" readonly />
      </div>
    </div>

    <!-- Coordinates display -->
    <div class="coordinates-group">
      <div class="form-group">
        <label for="latitude">Latitudine:</label>
        <input id="latitude" v-model="binForm.latitude" type="text" readonly />
      </div>
      
      <div class="form-group">
        <label for="longitude">Longitudine:</label>
        <input id="longitude" v-model="binForm.longitude" type="text" readonly />
      </div>
    </div>
  </form>
</template>

<style scoped>
.bin-form {
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

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
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

@media (max-width: 768px) {
  .address-details-grid,
  .coordinates-group {
    grid-template-columns: 1fr;
  }
}
</style> 