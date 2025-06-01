<template>
  <div ref="mapContainer" style="height: 500px; width: 100%"></div>
</template>

<script type="module">
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'

// Props che riceve il componente
const props = defineProps(['bins'])
const mapContainer = ref(null)
let map = null // riferimento alla mappa Leaflet

// Ho creato delle icone personalizzate per ogni tipo di cestino
// Le dimensioni vanno bene così ma forse in futuro potrei aumentarle
const icons = {
  vetro: L.icon({ iconUrl: 'glass-icon.png', iconSize: [25, 25] }),
  carta: L.icon({ iconUrl: 'paper-icon.png', iconSize: [25, 25] }),
  plastica: L.icon({ iconUrl: 'plastic-icon.png', iconSize: [25, 25] }),
  organico: L.icon({ iconUrl: 'organic-icon.png', iconSize: [25, 25] }),
  // Default icon per sicurezza
  default: L.icon({ iconUrl: 'default-icon.png', iconSize: [25, 25] })
}

// Inizializzo la mappa quando il componente è montato
onMounted(() => {
  // Coordinate di Milano come punto iniziale
  map = L.map(mapContainer.value).setView([45.4642, 9.1900], 13)
  
  // Aggiungo i tile di OpenStreetMap (gratis)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
  
  // Se ci sono già dei cestini, li mostro
  if (props.bins && props.bins.length) {
    updateMarkers()
  }
})

// Quando cambia la lista dei cestini, aggiorno i marker
watch(() => props.bins, () => {
  updateMarkers()
}, { deep: true }) // deep: true per rilevare anche cambiamenti dentro agli oggetti

// Funzione per aggiornare i marker sulla mappa
const updateMarkers = () => {
  // Pulisco prima tutti i marker esistenti
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer)
    }
  })

  // Se non ci sono cestini, esco
  if (!props.bins || !props.bins.length) return

  // Aggiungo un marker per ogni cestino
  props.bins.forEach(bin => {
    // Uso l'icona corrispondente al tipo o quella di default
    const icon = icons[bin.type] || icons.default
    
    L.marker([bin.lat, bin.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <strong>${bin.name || 'Cestino'}</strong><br>
        ${bin.address || 'Indirizzo non disponibile'}<br>
        Tipo: ${bin.type || 'Non specificato'}
      `)
  })
}
</script>