import mongoose from "mongoose";
import crypto from 'crypto';
import User from "./User.js"

const { Schema } = mongoose;

const TokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        index: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      type: {
        type: String,
        enum: ['password-reset', 'email-verification'],
        required: true,
      },
      expiresAt: {
        type: Date,
        default: Date.now,
        expires: 600, // Cancella dopo 10 minuti
      },
});

// Metodo statico per generare e salvare token
tokenSchema.statics.generateToken = async function (userId, type) {
    const rawtoken = crypto.randomBytes(32).toString('hex'); //token grezzo da inviare all'utente
    const hashedToken = crypto.randomBytes(32).toString('hex'); //Hash per il db

    // Cancella eventuali token precedenti dello stesso tipo
    await this.deleteMany({ userId, type });
    
    // Crea e salva il token nel DB (hashato)
    const tokenDoc = await this.create({
      token: hashedToken,
      userId,
      type,
    });

    return { tokenDoc, rawtoken}  //Restituisce entrambi
  };
  
  export default mongoose.model('Token', tokenSchema);