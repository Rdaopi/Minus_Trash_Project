import mongoose from 'mongoose';
import * as dotenv from 'dotenv';  // Importazione corretta per ES modules

// Configura dotenv
dotenv.config();

const connectDB = async () => {
  try {
    console.log('Tentativo di connessione a MongoDB Atlas...');

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
      ssl: true,
      serverSelectionTimeoutMS: 5000
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Atlas connesso: ${conn.connection.host}`);

  } catch (error) {
    console.error('Errore di connessione:', error.message);
    process.exit(1);
  }
};

export default connectDB;
