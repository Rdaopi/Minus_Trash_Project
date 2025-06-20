import mongoose from 'mongoose';
import crypto from 'crypto';

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
    isActive: {
        type: Boolean,
        default: true
    },
    blockedAt: {
        type: Date,
        default: null
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
    passwordChangedAt: Date,
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
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

// Note: Token generation is now handled by AuthService to avoid circular dependencies

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

// Method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    this.passwordResetExpires = Date.now() + 3600000; // 1 hour
    
    return resetToken;
};

export default mongoose.model('User', userSchema);