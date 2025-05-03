import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
//Importo l'URI del DB
const URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log('Connesso a MongoDB');
  } catch (err) {
    console.error('Errore connessione MongoDB:', err.message);
    process.exit(1);
  }
};

export default connectDB;