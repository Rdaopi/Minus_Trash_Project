import mongoose from 'mongoose';
import {config} from 'dotenv'; // Carica le variabili dal file .env

config({ path: '../.env' })

//CHANGES: Aggiunte connectionOptions
const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
  bufferCommands: false //Disabilita il buffering dei comandi se non connessi.
};

//FIX: Risolto caso in cui l'uri non sia configurato
if(!process.env.MONGODB_URI){
  throw new Error("MongoDB URI non configurato in .env");
}

const connectDB = async () => {
  try {    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
      console.log('Connesso a MongoDB:', mongoose.connection.host);
    }
  } catch (error) {
    console.error('Errore connessione MongoDB:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => {
  console.log('Connessione MongoDB attiva');
});

mongoose.connection.on('disconnected', () => {
  console.log('Connessione MongoDB interrotta');
});
export default connectDB; //Esporta la funzione connectDB per essere utilizzata altrove

// Test chiamate multiple
//await connectDB(); // Prima connessione
//await connectDB(); // Log: "Già connesso a MongoDB"

// Simula disconnessione
//await mongoose.disconnect();
//await connectDB(); // Nuova connessione