import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jsw  from 'jsonwebtoken';

const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "Username obbligatorio"],
        unique: true,
        trim: true,
        minlength: [3, "Lo username deve avere almeno 3 caratteri"],
        maxlength: [30, "Lo username non può superare i 30 caratteri"], 
        match: [/^(?=\w{3,30}$)(?!.*[_]{2})[a-zA-Z0-9_]+$/, "Sono ammessi solo lettere, numeri e underscore"]
    },
    fullName: { 
        name: { 
            type: String,
            required: [true, "Il nome è obbligatorio"],
            trim: true 
        }, 
        surname: {
            type: String,
            required: [true, "Il cognome è obbligatorio"],
            trim: true
        }
    },
    email: {
        type: String,
        required: [true, "L'email è obbligatoria"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,, "Email non valida"]
    },
    role: {
        type: String,
        enum: ["cittadino", "operatore_comunale"],
        default: "cittadino"
    },
    password: {
        type: String,
        required: [true, "Password obbligatoria"],
        minlength: [8, "La password deve avere almeno 8 caratteri"],
        select: false
    },

    authMethods: {
        local: { type: Boolean, default: true },
        google: {
            id: String,
            email: String
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

//----------------------------------------------------------------------------------------
//METODI DATABASE

// Middleware per hashare la password
userSchema.pre('save', async function(next) {
    /*
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    // Imposta passwordChangedAt se non è un documento nuovo
    if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
    next();
    */
    //----------------------------------------
    // Hash password solo se modificata
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
        
        // Aggiorna passwordChangedAt per invalidare token esistenti
        if (!this.isNew) {
            this.passwordChangedAt = Date.now() - 1000; 
        }
    }
    
    // Verifica modifiche a campi sensibili
    if (this.isModified('email')) {
        this.emailVerified = false; // Richiede nuova verifica email
        this.authMethods.local = true; // Forza autenticazione locale
    }
    
    // Sanificazione username
    if (this.isModified('username')) {
        this.username = this.username.trim().toLowerCase();
    }
    
    next();
    //-----------------------------------------
});

// Metodo per confrontare la password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Metodo per generare JWT
userSchema.methods.generateAuthToken = function() {
    return jwt.sign({ 
            id: this._id, role: this.role 
        },
        process.env.JWT_SECRET,{
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
};

// Metodo per verificare se la password è stata cambiata dopo JWT
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Gestione errori per campi univoci
userSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Username o email già esistenti'));
    } else {
        next(error);
    }
});

//Index
userSchema.index( 
    {email: 1, username: 1},
    { unique: true}
);

export default mongoose.model('User', userSchema);