//Base form component with address autocomplete functionality
<script setup>
import { ref, defineEmits, defineProps, defineExpose } from 'vue';

// Props per configurare il form base
const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  formTitle: {
    type: String,
    required: true
  },
  createTitle: {
    type: String,
    default: 'Nuovo'
  },
  editTitle: {
    type: String,
    default: 'Modifica'
  }
});

const emit = defineEmits(['submit', 'cancel']);

//Address form data reactive object (shared)
const addressForm = ref({
  address: '',
  street: '',
  streetNumber: '',
  city: '',
  cap: '',
  latitude: '',
  longitude: ''
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
  console.log('Fetching address suggestions for:', query, 'in city:', addressForm.value.city);
  
  if (!query || query.length < 3) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }
  
  if (!addressForm.value.city) {
    console.log('No city selected, cannot search for addresses');
    return;
  }
  
  loadingSuggestions.value = true;
  
  try {
    //Build search query with city context
    const cityQuery = `${query}, ${addressForm.value.city}`;
    const url =
      import.meta.env.PROD
        ? `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}&addressdetails=1&limit=10&countrycodes=it`
        : `/nominatim/search?format=json&q=${encodeURIComponent(cityQuery)}&addressdetails=1&limit=10&countrycodes=it`;
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
    /*
    //Search for Italian cities with simplified approach
    const url = `/nominatim/search?format=json&q=${encodeURIComponent(query + ', Italia')}&addressdetails=1&limit=8&countrycodes=it`;
    */
   // Use full Nominatim API URL in production, relative path in development
   const url =
      import.meta.env.PROD
        ? `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Italia')}&addressdetails=1&limit=8&countrycodes=it`
        : `/nominatim/search?format=json&q=${encodeURIComponent(query + ', Italia')}&addressdetails=1&limit=8&countrycodes=it`;
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
  addressForm.value.city = query;
  
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
  addressForm.value.street = addressDetails.road || '';
  addressForm.value.streetNumber = addressDetails.house_number || '';
  addressForm.value.city = addressDetails.city || addressDetails.town || addressDetails.village || '';
  addressForm.value.cap = addressDetails.postcode || '';
}

//Handle address input with debouncing
function handleAddressInput(e) {
  const query = e.target.value;
  addressForm.value.address = query;
  
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
  addressForm.value.city = s.displayName;
  
  //Update postal code if available
  if (s.postcode) {
    addressForm.value.cap = s.postcode;
    console.log('Updated CAP to:', s.postcode);
  }
  
  //Clear suggestions with timeout
  setTimeout(() => {
    showCitySuggestions.value = false;
    citySuggestions.value = [];
  }, 100);
  
  //Clear address field since city changed
  addressForm.value.address = '';
  addressForm.value.street = '';
  addressForm.value.streetNumber = '';
  addressForm.value.latitude = '';
  addressForm.value.longitude = '';
}

//Handle address suggestion selection
function selectSuggestion(s) {
  console.log('Selected address suggestion:', s);
  addressForm.value.address = s.display_name;
  addressForm.value.latitude = s.lat;
  addressForm.value.longitude = s.lon;
  parseAddress(s.address);
  
  //Clear suggestions with timeout
  setTimeout(() => {
    showSuggestions.value = false;
    suggestions.value = [];
  }, 100);
}

//Handle form cancellation
function handleCancel() {
  resetAddressForm();
  emit('cancel');
}

//Reset address form to initial state
function resetAddressForm() {
  addressForm.value = {
    address: '',
    street: '',
    streetNumber: '',
    city: '',
    cap: '',
    latitude: '',
    longitude: ''
  };
  suggestions.value = [];
  showSuggestions.value = false;
  citySuggestions.value = [];
  showCitySuggestions.value = false;
}

//Load address data from external source
function loadAddressData(data) {
  if (!data) return;
  
  console.log('Loading address data:', data);
  
  // Helper function to safely extract address string
  const extractAddress = (data) => {
    // If data.address exists and is a string
    if (data.address && typeof data.address === 'string') {
      return data.address;
    }
    
    // If data.location.address exists
    if (data.location && data.location.address) {
      if (typeof data.location.address === 'string') {
        return data.location.address;
      }
      
      // If it's an object, construct the address string
      if (typeof data.location.address === 'object' && data.location.address !== null) {
        const addr = data.location.address;
        const parts = [];
        
        if (addr.street) parts.push(addr.street);
        if (addr.number || addr.streetNumber) parts.push(addr.number || addr.streetNumber);
        if (addr.city) parts.push(addr.city);
        if (addr.postalCode) parts.push(addr.postalCode);
        
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    }
    
    // Fallback to coordinates if available
    const lat = data.lat || data.latitude || (data.location?.coordinates?.[1]);
    const lng = data.lng || data.longitude || (data.location?.coordinates?.[0]);
    if (lat && lng) {
      return `Coordinate: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    
    return '';
  };
  
  addressForm.value = {
    address: extractAddress(data),
    street: data.street || (data.location?.address?.street) || '',
    streetNumber: data.streetNumber || (data.location?.address?.number) || (data.location?.address?.streetNumber) || '',
    city: data.city || (data.location?.address?.city) || '',
    cap: data.cap || (data.location?.address?.postalCode) || '',
    latitude: data.lat || data.latitude || (data.location?.coordinates?.[1]) || '',
    longitude: data.lng || data.longitude || (data.location?.coordinates?.[0]) || ''
  };
}

//Build location object for backend
function buildLocationData() {
  return {
    type: 'Point',
    coordinates: [parseFloat(addressForm.value.longitude), parseFloat(addressForm.value.latitude)],
    address: {
      street: addressForm.value.street,
      number: addressForm.value.streetNumber,
      city: addressForm.value.city,
      postalCode: addressForm.value.cap
    }
  };
}

//Expose methods and data for parent component access
defineExpose({ 
  addressForm,
  resetAddressForm,
  loadAddressData,
  buildLocationData,
  handleCancel
});
</script>

<template>
  <div class="base-form">
    <div class="form-header" v-if="editMode">
      <h3><i class="fas fa-edit"></i> {{ editTitle }} {{ formTitle }}</h3>
    </div>
    <div class="form-header" v-else>
      <h3><i class="fas fa-plus"></i> {{ createTitle }} {{ formTitle }}</h3>
    </div>
    
    <!-- Slot per campi specifici del form (prima dell'indirizzo) -->
    <slot name="specific-fields"></slot>
    
    <!-- Sezione indirizzo comune -->
    <div class="address-section">
      <div class="form-group">
        <label for="city">Città:</label>
        <input 
          id="city" 
          v-model="addressForm.city" 
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
          v-model="addressForm.address" 
          type="text" 
          @input="handleAddressInput" 
          :disabled="!addressForm.city" 
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
          <input id="street-readonly" v-model="addressForm.street" type="text" readonly />
        </div>
        
        <div class="form-group">
          <label for="streetNumber-readonly">Numero Civico:</label>
          <input id="streetNumber-readonly" v-model="addressForm.streetNumber" type="text" readonly />
        </div>
        
        <div class="form-group">
          <label for="city-readonly">Città:</label>
          <input id="city-readonly" v-model="addressForm.city" type="text" readonly />
        </div>
        
        <div class="form-group">
          <label for="cap-readonly">CAP:</label>
          <input id="cap-readonly" v-model="addressForm.cap" type="text" readonly />
        </div>
      </div>

      <!-- Coordinates display -->
      <div class="coordinates-group">
        <div class="form-group">
          <label for="latitude-readonly">Latitudine:</label>
          <input id="latitude-readonly" v-model="addressForm.latitude" type="text" readonly />
        </div>
        
        <div class="form-group">
          <label for="longitude-readonly">Longitudine:</label>
          <input id="longitude-readonly" v-model="addressForm.longitude" type="text" readonly />
        </div>
      </div>
    </div>

    <!-- Slot per campi aggiuntivi (dopo l'indirizzo) -->
    <slot name="additional-fields"></slot>

    <!-- Slot per i pulsanti del form -->
    <slot name="form-buttons"></slot>
  </div>
</template>

<style scoped>
.base-form {
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

.address-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  background: #fafafa;
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

@media (max-width: 768px) {
  .address-details-grid,
  .coordinates-group {
    grid-template-columns: 1fr;
  }
}
</style> 