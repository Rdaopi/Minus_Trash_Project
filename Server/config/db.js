import mongoose from 'mongoose';
import dotenv from 'dotenv';

//ATTENZIONE FONDAMENTALE:  Se si prova a connettersi ad ATLAS non utilizzare
//                          il wifi dell'Università di Trento, non si connette.
//                          Utilizzare wifi differente.

// Inizializza dotenv con il path corretto
dotenv.config({ path: './config/.env' });

// Utilizza MongoDB locale come fallback se MONGODB_URI non è definito
const uri = process.env.MONGODB_URI_LOCAL;

// Opzioni di connessione semplificate per localhost
const clientOptions = { 
  connectTimeoutMS: 10000
};

/**
 * Connette al database MongoDB
 * @returns {Promise<mongoose.Connection>} La connessione mongoose
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(uri, clientOptions);
    console.log(`MongoDB connesso: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Errore connessione MongoDB:', error.message);
    process.exit(1);
  }
}

export default connectDB;