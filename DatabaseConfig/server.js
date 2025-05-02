import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js'; // Estensione .js obbligatoria

const db = "minus_trash_db";
const password  = "UnicornoVolante";
const uri = `mongodb+srv://RiccardoG:${password}@minustrashproject.hhp2uxz.mongodb.net/${db}?retryWrites=true&w=majority&appName=minusTrashProject/${db}`;

const clientOptions = { 
  serverApi: { 
    version: '1', 
    strict: true, 
    deprecationErrors: true 
  } 
};

async function run() {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("Connesso a MongoDB Atlas!");

    // Test: Crea un utente
    const newUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: "password123", // La password verrà hashat automaticamente dal middleware
      fullName: [{ name: "Test", surname: "User" }],
      role: "cittadino"
    });

    console.log("Utente creato:", newUser);

  } catch (err) {
    console.error("Errore:", err.message);
    if (err.code === 11000) {
      console.log("Errore: Username o email già esistente!");
    }
  } finally {
    await mongoose.disconnect();
    console.log("Connessione chiusa");
  }
}

run();