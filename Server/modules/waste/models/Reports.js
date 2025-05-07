// modules/waste/models/Bin.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const binSchema = new Schema({

    // 1. Utente che ha fatto la segnalazione
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Utente segnalatore obbligatorio']
    },

    // 2. Descrizione breve
    description: {
        type: String,
        required: [true, 'Descrizione obbligatoria'],
        maxlength: [280, 'La descrizione non può superare i 280 caratteri'],
        trim: true
    },

    // 3. Data segnalazione
    reportDate: {
        type: Date,
        default: Date.now
    },

    // 4. Tipo di segnalazione
    type: {
        type: String,
        enum: {
            values: ['malfunzionamento', 'strada_sporca', 'cestino_pieno', 'raccolta_saltata'],
            message: 'Tipo segnalazione non valido'
        },
        required: [true, 'Tipo segnalazione obbligatorio']
    },

    // 5. Posizione complessa
    location: {
        // Caso 5.1 (strada_sporca || raccolta_saltata)
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere',
            validate: {
                validator: function (v) {
                    // Richiesto se non c'è address e il tipo è strada o raccolta
                    return this.type.match(/(strada_sporca|raccolta_saltata)/)
                        ? v.length === 2
                        : true;
                },
                message: 'Coordinate GPS non valide'
            }
        },
        address: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    // Richiesto se non ci sono coordinate e tipo strada o raccolta
                    return this.type.match(/(strada_sporca|raccolta_saltata)/)
                        ? !!v || !!this.coordinates?.length
                        : true;
                },
                message: 'Indirizzo manuale richiesto per questo tipo di segnalazione'
            }
        },

        // Caso 5.2 (malfunzionamento || cestino_pieno)
        binCode: {
            type: String,
            trim: true,
            uppercase: true,
            match: [/^[A-Z0-9]{6,10}$/, 'Codice cestino non valido'],
            validate: {
                validator: function (v) {
                    // Richiesto per tipi di segnalazione su cestini
                    return this.type.match(/(malfunzionamento|cestino_pieno)/)
                        ? !!v
                        : true;
                },
                message: 'Codice cestino obbligatorio per questo tipo di segnalazione'
            }
        }
    },

    // Stato della segnalazione
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved'],
        default: 'pending'
    },

    // Priorità (calcolabile in base al tipo + numero segnalazioni)
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indici per ottimizzazione query
binSchema.index({ type: 1, status: 1 });
binSchema.index({ 'location.binCode': 1 });
binSchema.index({ createdAt: -1 });

// Virtual per indirizzo completo (se GPS disponibile)
binSchema.virtual('formattedAddress').get(function () {
    if (this.location.address) return this.location.address;
    if (this.location.coordinates?.length === 2) return 'Posizione GPS';
    return 'Indirizzo non disponibile';
});

// Validazione incrociata pre-save
binSchema.pre('validate', function (next) {
    if (this.type.match(/(strada_sporca|raccolta_saltata)/) &&
        !this.location.coordinates?.length &&
        !this.location.address
    ) {
        this.invalidate('location', 'Richiesta posizione GPS o indirizzo manuale');
    }

    if (this.type.match(/(malfunzionamento|cestino_pieno)/) && !this.location.binCode) {
        this.invalidate('location.binCode', 'Codice cestino obbligatorio');
    }

    next();
});

export default mongoose.model('Bin', binSchema);