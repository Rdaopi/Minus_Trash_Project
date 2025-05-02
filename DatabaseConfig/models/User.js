import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "Username obbligatorio"],
        unique: true,
        trim: true, // Corretto da "trime"
        minlength: [3, "Lo username deve avere almeno 3 caratteri"], // Corretto da "minlenght"
        maxlength: [30, "Lo username non può superare i 30 caratteri"], // Corretto da "maxlenght"
        match: [/^[a-zA-Z0-9_]+$/, "Sono ammessi solo lettere, numeri e underscore"]
    },
    fullName: [{ 
        name: { 
            type: String,
            required: [true, "Il nome è obbligatorio"],
            trim: true // Corretto da "trime"
        }, 
        surname: {
            type: String,
            required: [true, "Il cognome è obbligatorio"],
            trim: true // Corretto da "trime"
        }
    }],
    email: {
        type: String,
        required: [true, "L'email è obbligatoria"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email non valida"]
    },
    role: {
        type: String,
        enum: ["cittadino", "operatore_comunale"],
        default: "cittadino"
    },
    password: {
        type: String,
        required: [true, "Password obbligatoria"],
        minlength: [8, "La password deve avere almeno 8 caratteri"], // Corretto da "minlenght"
        select: false
    },
    passwordChangedAt: Date
}, {
    timestamps: true
});

// Middleware per hashare la password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Metodo per confrontare la password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Gestione errori per campi univoci
userSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Username o email già esistenti'));
    } else {
        next(error);
    }
});

export default mongoose.model('User', userSchema);