import mongoose from 'mongoose';
import {config} from 'dotenv'; // Carica le variabili dal file .env

//una cartella sopra rispetto al quella corrente
config({ path: '../.env' })

//CHANGES: Aggiunte connectionOptions
const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
  //useNewUrlParser: true,    // obsoleto Mongoose (v6+)
  //useUnifiedTopology: true,// obsoleto Mongoose (v6+)
  //forse questo serve
  bufferCommands: false //Disabilita il buffering dei comandi se non connessi.
};

//FIX: Risolto caso in cui l'uri non sia configurato
if(!process.env.MONGODB_URI){
  throw new Error("MongoDB URI non configurato in .env"); //Verifica se la variabile MONGODB_URI è definita nel file .env
}

let connectionPromise = null; // Memorizza la promise di connessione

const connectDB = async () => {
  try {
    /*
    if (mongoose.connection.readyState != 1) {// connette a MongoDB solo se c'è una connessione attiva 
      await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
      console.log('Connesso a MongoDB:', mongoose.connection.host);
    }
      */
    //---------------------------------------------------------
    // SERVE PER EVITARE CHIAMATE MULTIPLA
    // Se già connesso, non fare nulla  
    if (mongoose.connection.readyState === 1) {
      console.log('Già connesso a MongoDB');
      return;
    }
    
    // Se la connessione è già in corso, ritorna la promise esistente
    if (!connectionPromise) {
      connectionPromise = mongoose.connect(
        process.env.MONGODB_URI, 
        connectionOptions

      ).then((conn) => {
        console.log('Connesso a MongoDB:', conn.connection.host);
        return conn;
      });
    }
    await connectionPromise;
    
    //---------------------------------------------------------

  } catch (error) {
    // Resetta la promise in caso di errore
    connectionPromise = null;
    console.error('Errore connessione MongoDB:', error.message);
    process.exit(1);
  }
};

//Ascolta gli eventi di connessione/disconnessione e stampa messaggi di log per il debug
mongoose.connection.on('connected', () => {
  console.log('Connessione MongoDB attiva');  
});

mongoose.connection.on('disconnected', () => {
  console.log('Connessione MongoDB interrotta');
  connectionPromise = null; // Resetta per permettere nuove connessioni
});

export default connectDB;//Esporta la funzione connectDB per essere utilizzata altrove



// Test chiamate multiple
await connectDB(); // Prima connessione
await connectDB(); // Log: "Già connesso a MongoDB"

// Simula disconnessione
await mongoose.disconnect();
await connectDB(); // Nuova connessione