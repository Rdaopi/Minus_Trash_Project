import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Token from './Token.js';

const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "Username obbligatorio"],
        unique: true,
        trim: true,
        minlength: [3, "Lo username deve avere almeno 3 caratteri"],
        maxlength: [30, "Lo username non può superare i 30 caratteri"], 
        match: [/^(?=[\w.]{3,30}$)(?!.*[_.]{2})[a-zA-Z0-9._]+$/, "Sono ammessi solo lettere, numeri, underscore e punto"]
    },
    fullName: { 
        name: { 
            type: String,
            required: [true, "Il nome è obbligatorio"],
            trim: true,
            default: "Nome"
        }, 
        surname: {
            type: String,
            required: [true, "Il cognome è obbligatorio"],
            trim: true,
            default: "Cognome"
        }
    },
    email: {
        type: String,
        required: [true, "L'email è obbligatoria"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Email non valida"]
    },
    role: {
        type: String,
        enum: ["cittadino", "operatore_comunale", "amministratore"],
        default: "cittadino"
    },
    password: {
        type: String,
        required: function() {
            return this.authMethods?.local === true;
        },
        minlength: [8, "La password deve avere almeno 8 caratteri"],
        select: false
    },

    authMethods: {
        local: { type: Boolean, default: false },
        google: {
            id: String,
            email: String,
            enabled: { type: Boolean, default: false }
        }
    },

    lastLogin: Date,
    activeSessions: [{ 
        device: String,
        ip: String,
        createdAt: Date
    }],
    passwordChangedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
//Index
userSchema.index( 
    {email: 1, username: 1},
    { unique: true}
);
/*
// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
        { 
            id: this._id,
            role: this.role 
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '1m' }
    );
    return token;
};*/

// Method to generate both access and refresh tokens
userSchema.methods.generateTokens = async function(ip, userAgent) {
    const accessToken = jwt.sign(
        { 
            id: this._id,
            role: this.role 
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '1m' }
        //1m for testing
    );

    const refreshToken = jwt.sign(
        { id: this._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    // Save refresh token in database
    await Token.create({
        user: this._id,
        refreshToken, // Will be automatically hashed by the pre-save middleware
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: ip,
        userAgent
    });

    return { accessToken, refreshToken };
};

// Method to check if user can change password
userSchema.methods.canChangePassword = function() {
    return this.authMethods?.local === true;
};

// Method to check if password was changed after a specific timestamp
userSchema.methods.changedPasswordAfter = function(timestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return timestamp < changedTimestamp;
    }
    return false;
};

export default mongoose.model('User', userSchema);