import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    // Tipo di segnalazione
    reportType: {
        type: String,
        required: true,
        enum: [
            'RIFIUTI_ABBANDONATI',    
            'AREA_SPORCA',            
            'PROBLEMA_CESTINO',       
            'RACCOLTA_SALTATA',       
            'VANDALISMO',             
            'SCARICO_ILLEGALE',       
            'ALTRO'                   
        ]
    },

    // Sottotipo specifico basato sul reportType
    reportSubtype: {
        type: String,
        required: function() {
            return this.reportType === 'PROBLEMA_CESTINO' || 
                   this.reportType === 'RIFIUTI_ABBANDONATI';
        },
        enum: {
            values: [
                //Sottotipi per PROBLEMA_CESTINO
                'ROTTO',             
                'PIENO',              
                'MANCANTE',           
                'SPORCO',             
                //Sottotipi per RIFIUTI_ABBANDONATI
                'PLASTICA',           
                'CARTA',              
                'VETRO',              
                'ORGANICO',           
                'RAEE',   
                'INDIFFERENZIATO',    
                'ALTRO'               
            ],
            message: 'Sottotipo non valido per questo tipo di segnalazione'
        }
    },

    severity: {
        type: String,
        required: true,
        enum: ['BASSA', 'MEDIA', 'ALTA', 'URGENTE'],
        default: 'BASSA'
    },

    location: {
        type: {
            type: String,
            default: 'Point',
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            street: String,
            number: String,
            city: String,
            postalCode: String,
            additionalInfo: String
        }
    },

    // Riferimento opzionale al cestino (solo se reportType è PROBLEMA_CESTINO)
    relatedBin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bin',
        required: function() {
            return this.reportType === 'PROBLEMA_CESTINO' && 
                   this.reportSubtype !== 'MANCANTE';
        }
    },

    description: {
        type: String,
        required: true,
        maxLength: 1000
    },

    images: [{
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        description: String
    }],

    status: {
        type: String,
        enum: [
            'IN_ATTESA',          
            'VERIFICATO',         
            'IN_LAVORAZIONE',      
            'RISOLTO',            
            'RIFIUTATO',          
            'PROGRAMMATO'         
        ],
        default: 'IN_ATTESA'
    },

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    verificationDetails: {
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: Date,
        notes: String,
        estimatedResolutionTime: Date
    },

    resolutionDetails: {
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolvedAt: Date,
        actionTaken: String,
        followUpRequired: Boolean,
        followUpNotes: String
    },

    // Per segnalazioni di raccolta saltata
    missedCollectionDetails: {
        wasteType: {
            type: String,
            enum: ['PLASTICA', 'CARTA', 'VETRO', 'ORGANICO', 'RAEE', 'INDIFFERENZIATO', 'ALTRO'],
            required: function() {
                return this.reportType === 'RACCOLTA_SALTATA';
            }
        },
        scheduledDate: Date,
        area: String
    },

    // Metadati temporali
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    scheduledInterventionDate: Date
});

// Indici
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1, severity: 1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ 'missedCollectionDetails.scheduledDate': 1 });

// Middleware pre-save
reportSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Validazione custom
reportSchema.path('reportSubtype').validate(function(value) {
    if (this.reportType === 'PROBLEMA_CESTINO') {
        return ['ROTTO', 'PIENO', 'MANCANTE', 'SPORCO'].includes(value);
    }
    if (this.reportType === 'RIFIUTI_ABBANDONATI') {
        return ['PLASTICA', 'CARTA', 'VETRO', 'ORGANICO', 'RAEE', 'INDIFFERENZIATO', 'ALTRO'].includes(value);
    }
    return true;
});

// Metodi di istanza
reportSchema.methods = {
    verify(verifierUserId, notes = '', estimatedResolutionTime = null) {
        this.status = 'VERIFICATO';
        this.verificationDetails = {
            verifiedBy: verifierUserId,
            verifiedAt: new Date(),
            notes: notes,
            estimatedResolutionTime
        };
    },

    startProgress() {
        this.status = 'IN_LAVORAZIONE';
    },

    resolve(resolverUserId, actionTaken, followUpRequired = false, followUpNotes = '') {
        this.status = 'RISOLTO';
        this.resolutionDetails = {
            resolvedBy: resolverUserId,
            resolvedAt: new Date(),
            actionTaken,
            followUpRequired,
            followUpNotes
        };
    },

    schedule(date) {
        this.status = 'PROGRAMMATO';
        this.scheduledInterventionDate = date;
    },

    reject(verifierUserId, reason) {
        this.status = 'RIFIUTATO';
        this.verificationDetails = {
            verifiedBy: verifierUserId,
            verifiedAt: new Date(),
            notes: reason
        };
    }
};

// Virtuals
reportSchema.virtual('isUrgent').get(function() {
    return this.severity === 'URGENTE';
});

reportSchema.virtual('age').get(function() {
    return Date.now() - this.createdAt;
});

const Report = mongoose.model('Report', reportSchema);

export default Report; 