import mongoose from 'mongoose';
import dotenv from 'dotenv';

//ATTENZIONE FONDAMENTALE:  Se si prova a connettersi ad ATLAS non utilizzare
//                          il wifi dell'UNI, non si connette.
//                          Utilizzare wifi differente.

// Inizializza dotenv con il path corretto
dotenv.config({ path: './config/.env' });

// Check se MONGODB_URI è definito
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

const uri = process.env.MONGODB_URI;

// Opzioni di connessione
const clientOptions = { 
  serverApi: { version: '1', strict: true, deprecationErrors: true },
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