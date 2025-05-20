<template>
  <div class="home">
    <section class="hero">
      <h1>Benvenuto in <span class="highlight">MinusTrash</span></h1>
      <p class="subtitle">Insieme per un futuro più sostenibile</p>
      <div class="cta-buttons">
        <router-link to="/map" class="cta-button primary">
          <i class="fas fa-map-marker-alt"></i> Trova Cestini
        </router-link
        <router-link to="/profile" class="cta-button secondary"
          <i class="fas fa-user"></i> Area Personale
        </router-link>
      </div>
    </section>

    <section class="features">
      <h2>Come Funziona</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <i class="fas fa-search feature-icon"></i>
          <h3>Trova</h3>
          <p>Localizza i punti di raccolta più vicini a te sulla mappa</p>
        </div>
        <div class="feature-card">
          <i class="fas fa-recycle feature-icon"></i>
          <h3>Ricicla</h3>
          <p>Smaltisci correttamente i tuoi rifiuti nei contenitori dedicati</p>
        </div>
        <div class="feature-card">
          <i class="fas fa-leaf feature-icon"></i>
          <h3>Contribuisci</h3>
          <p>Aiuta l'ambiente e la tua città a rimanere pulita</p>
        </div>
      </div>
    </section>

    <section class="eco-tips">
      <h2>Consigli Eco-Friendly</h2>
      <div class="tips-carousel">
        <div class="tip-card">
          <i class="fas fa-lightbulb tip-icon"></i>
          <h4>Riduci</h4>
          <p>Scegli prodotti con meno imballaggi</p>
        </div>
        <div class="tip-card">
          <i class="fas fa-sync-alt tip-icon"></i>
          <h4>Riusa</h4>
          <p>Dai una seconda vita agli oggetti</p>
        </div>
        <div class="tip-card">
          <i class="fas fa-recycle tip-icon"></i>
          <h4>Ricicla</h4>
          <p>Separa correttamente i materiali</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
// Componente Home - è la pagina principale dell'applicazione
export default {
  name: 'Home',
  // ma per ora è solo un page statica di presentazione
  //Dentro potrebbero esserci link a video, immagini, ecc.
}
</script>

<style scoped>
/* Stile generale home*/
.home {
  max-width: 1200px;
  margin: 0 auto;
}

/* Hero section, la prima cosa che vede l'utente */
.hero {
  text-align: center;
  padding: 4rem 1rem;
  background: linear-gradient(rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05));
  border-radius: 2.5rem;
  margin-bottom: 3rem;
}

/* Titolo principale */
.hero h1 {
  font-size: 3rem;
  color: var(--text-color);
  margin-bottom: 1rem;
}

/* Metto in risalto parti del testo */
.highlight {
  color: var(--primary-color);
}

/* Sottotitolo che spiega il concetto principale */
.subtitle {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 2rem;
}

/* Bottoni call-to-action */
.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.cta-button {
  padding: 1rem 2rem;
  border-radius: 8rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
  position: relative;
  overflow: hidden;
  font-size: 1rem;
  cursor: pointer;
}

.cta-button.primary {
  background-color: var(--white-color);
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.cta-button.secondary {
  background-color: white;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.cta-button:hover, .cta-button:focus {
  background-color: #388e3c;
  color: #fff;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  animation: pulseGlow 1.5s infinite;
  outline: none;
}

.cta-button.secondary:hover, .cta-button.secondary:focus {
  background-color: var(--primary-color);
  color: #fff;
}

.cta-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
}

@keyframes pulseGlow {
  0% {
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  }
  50% {
    box-shadow: 0 5px 25px rgba(76, 175, 80, 0.7);
  }
  100% {
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  }
}
/* Sezione caratteristiche */
.features {
  padding: 3rem 1rem;
}

.features h2 {
  text-align: center;
  margin-bottom: 3rem;
  color: var(--text-color);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 0 1rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 2.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

/* Sezione consigli ecologici */
.eco-tips {
  padding: 3rem 1rem;
  background-color: var(--background2-color);
  border-radius: 2.5rem;
  margin-top: 3rem;
}

.eco-tips h2 {
  text-align: center;
  margin-bottom: 3rem;
}

/* Ho usato grid invece di un vero carosello per semplicità
   ma in futuro lo sostituirò con uno slideshow */
.tips-carousel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  padding: 0 1rem;
}

.tip-card {
  text-align: center;
  padding: 1.5rem;
  background: white;
  border-radius: 2.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.tip-card:hover {
  transform: scale(1.05);
}

.tip-icon {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

/* Adattamento per mobile - non mi piacciono i siti non responsive! */
@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem; /* più piccolo su mobile */
  }

  .subtitle {
    font-size: 1.2rem;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .feature-grid {
    grid-template-columns: 1fr; /* una colonna su mobile */
  }

  .tips-carousel {
    grid-template-columns: 1fr;
  }
}
</style>