import mongoose from "mongoose";
import crypto from 'crypto';
import User from "./User.js"
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const TokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refreshToken: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    ipAddress: String,
    userAgent: String,
    revoked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Add index for faster queries
TokenSchema.index({ user: 1, refreshToken: 1 });

// Method to check if token is expired
TokenSchema.methods.isExpired = function() {
    return Date.now() >= this.expiresAt;
};

// Method to check if token is valid
TokenSchema.methods.isValid = function() {
    return !this.revoked && !this.isExpired();
};

// Static method to hash a refresh token
TokenSchema.statics.hashToken = async function(token) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(token, salt);
};

// Method to verify a refresh token
TokenSchema.methods.verifyToken = async function(token) {
    try {
        return await bcrypt.compare(token, this.refreshToken);
    } catch (error) {
        console.error('Error verifying token:', error);
        return false;
    }
};

// Static method to revoke all tokens for a user
TokenSchema.statics.revokeAllUserTokens = async function(userId) {
    return this.updateMany(
        { user: userId, revoked: false },
        { revoked: true }
    );
};

// Pre-save middleware to hash the refresh token
TokenSchema.pre('save', async function(next) {
    // Only hash the token if it's new or modified
    if (!this.isModified('refreshToken')) return next();
    
    try {
        this.refreshToken = await TokenSchema.statics.hashToken(this.refreshToken);
        next();
    } catch (error) {
        next(error);
    }
});

// Metodo statico per generare e salvare token
TokenSchema.statics.generateToken = async function (userId, type) {
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
  
export default mongoose.model('Token', TokenSchema);