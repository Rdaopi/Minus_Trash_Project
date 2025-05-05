import mongoose from 'mongoose';
import {config} from 'dotenv'; // Carica le variabili dal file .env

config({ path: '../.env' })

const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
};

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

export default connectDB;