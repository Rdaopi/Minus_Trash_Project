import mongoose from 'mongoose';
const { Schema } = mongoose;

const binSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['organico', 'plastica', 'carta', 'vetro', 'indifferenziato', 'raee', 'altro'],
    },
    capacity: {
        type: Number,
        required: true,
        min: 0,
    },
    currentFillLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    location: {
        type: {
            type: String,
            default: 'Point',
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
        address: {
            street: String,
            city: String,
            postalCode: String,
            country: String,
        },
    },
    status: {
        type: String,
        enum: ['attivo', 'manutenzione', 'inattivo'],
        default: 'attivo',
    },
    lastEmptied: {
        type: Date,
        default: Date.now,
    },
    maintenanceSchedule: {
        lastMaintenance: Date,
        nextMaintenance: Date,
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true,
    },
    manufacturer: {
        type: String,
        required: true,
    },
    installationDate: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

//Indice geospaziale per ricerche basate sulla location
binSchema.index({ location: '2dsphere' });
//Indice per ricerche veloci per serial number
binSchema.index({ serialNumber: 1 });

//Middleware pre-save per aggiornare updatedAt
binSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Metodo per verificare se il cestino necessita di svuotamento
binSchema.methods.needsEmptying = function() {
    return this.currentFillLevel >= 80; // 80% come soglia di esempio
};

// Metodo per verificare se il cestino necessita di manutenzione
binSchema.methods.needsMaintenance = function() {
    if (!this.maintenanceSchedule.nextMaintenance) return false;
    return new Date() >= this.maintenanceSchedule.nextMaintenance;
};

const Bin = mongoose.model('Bin', binSchema);

export default Bin;