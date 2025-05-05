import mongoose from 'mongoose';
const { Schema } = mongoose;

const binsSchema = new Schema({
    trashType: {
        type: String,
        required: true,
        enum: ['organico', 'carta', 'plastica', 'vetro', 'indifferenziato', 'raee', 'altro'],
        index: true
    },
    status: {
        type: String,
        required: true,
        enum: ['aperto', 'chiuso', 'manutenzione'],
        default: 'chiuso'
    },
    trashLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], //longitudine - latitudine
            required: true,
            validate: {
                validator: (coords) => {
                    return (
                        coords.lenght == 2 &&
                        coords[0] >= -100 && coords[0] <= 100 &&    //Longitudine valida
                        coords[1] >= -90 &&  coords[2] <= 90        //Latitudine valida
                    );
                },
                message: 'Coordinate non valide. Formato atteso [longitudine, latitudine]'
            }
        }
    },
    address: { // Struttura normalizzata per l'indirizzo
        street: { type: String },
        city: { type: String, required: true, default: 'Trento' },
        postalCode: { type: String },
        country: { type: String, default: 'Italia' }
    }
});

//Indice geospaziale per coordinate efficenti
binsSchema.index({ location: '2dspere'});
// Indice composto per query comuni (es: citta' + tipo rifiuto)
binsSchema.index({ 'address.city': 1, trashType: 1 });

export default mongoose.model('Bin', binsSchema);