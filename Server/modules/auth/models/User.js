import mongoose from 'mongoose';

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
//Index
userSchema.index( 
    {email: 1, username: 1},
    { unique: true}
);

export default mongoose.model('User', userSchema);