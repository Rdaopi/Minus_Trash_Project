import fs from 'fs';
import path from 'path';

// Funzione per verificare il file .env
function checkEnvFile() {
  try {
    // Percorso al file .env
    const envPath = path.join(process.cwd(), '.env');
    
    // Verifica se il file esiste
    if (!fs.existsSync(envPath)) {
      console.log('File .env non trovato in:', process.cwd());
      return;
    }
    
    // Leggi il contenuto del file
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('File .env trovato');
    
    // Controlla il formato del file
    const lines = envContent.split('\n');
    const mongoLine = lines.find(line => line.startsWith('MONGODB_URI='));
    
    if (!mongoLine) {
      console.log('MONGODB_URI non trovata nel file .env');
      return;
    }
    
    console.log('MONGODB_URI trovata nel file .env');
    
    // Verifica possibili problemi nel formato
    if (mongoLine.includes(' ')) {
      console.log('Attenzione: MONGODB_URI contiene spazi');
    }
    
    if (mongoLine.includes('\r')) {
      console.log('Attenzione: MONGODB_URI contiene caratteri di ritorno a capo (\\r)');
    }
    
    // Estrai la parte dell'URI
    const uri = mongoLine.substring(mongoLine.indexOf('=') + 1).trim();
    
    // URI mascherato per la sicurezza
    const maskedUri = uri.replace(
      /(mongodb\+srv:\/\/)([^:]+):([^@]+)@/,
      '$1$2:****@'
    );
    
    console.log('\nURI MongoDB (mascherato):', maskedUri);
    
    // Verifica il formato base
    if (!uri.startsWith('mongodb+srv://')) {
      console.log('Errore: L\'URI deve iniziare con "mongodb+srv://"');
    }
    
    // Estrai e verifica parti dell'URI
    try {
      const dbPart = uri.split('/').pop().split('?')[0];
      console.log('Nome database:', dbPart || 'NON TROVATO');
      
      if (!dbPart) {
        console.log('Errore: Nome database mancante nell\'URI');
      }
      
      // Controlla se l'URI è troncato o modificato
      if (uri.endsWith('PORT=') || uri.includes('PORT=')) {
        console.log('Errore: L\'URI sembra essere concatenato con altre variabili');
        console.log('   Assicurati che ogni variabile sia su una riga separata nel file .env');
      }
      
    } catch (err) {
      console.log('Errore durante l\'analisi dell\'URI:', err.message);
    }
    
    console.log('\nIl formato corretto dovrebbe essere:');
    console.log('MONGODB_URI=mongodb+srv://username:password@clustername.mongodb.net/database?retryWrites=true&w=majority');
    
  } catch (error) {
    console.log('Errore durante la verifica del file .env:', error.message);
  }
}

checkEnvFile(); 