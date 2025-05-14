<template>
  <div class="not-found">
    <h1>404</h1>
    <h2>Pagina Non Trovata</h2>
    <p>La pagina che stai cercando non esiste.</p>
    <router-link to="/" class="home-link">Torna alla Home</router-link>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

// Pagina di errore 404
// TODO: aggiungere qualche grafica simpatica a tema riciclo
export default defineComponent({
  name: 'NotFound'
})
</script>

<style scoped>
/* Semplice pagina centrata */
.not-found {
  text-align: center;
  padding: 2rem;
}

/* Numero 404 grande e colorato */
h1 {
  font-size: 6rem;
  margin: 0;
  color: #ff4757;
}

h2 {
  font-size: 2rem;
  margin: 1rem 0;
}

/* Bottone per tornare alla home */
.home-link {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.8rem 1.5rem;
  background-color: #2196f3;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.home-link:hover {
  background-color: #1976d2;
}
</style> 