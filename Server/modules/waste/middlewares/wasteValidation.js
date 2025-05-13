import { logger } from '../../../core/utils/logger.js';

export const validateWasteReport = (req, res, next) => {
    const { reportType, reportSubtype, severity, location } = req.body;

    //Validazione del tipo di segnalazione
    const validReportTypes = [
        'RIFIUTI_ABBANDONATI',
        'AREA_SPORCA',
        'PROBLEMA_CESTINO',
        'RACCOLTA_SALTATA',
        'VANDALISMO',
        'SCARICO_ILLEGALE',
        'ALTRO'
    ];

    if (!reportType || !validReportTypes.includes(reportType)) {
        logger.warn(`Tipo di segnalazione non valido: ${reportType}`);
        return res.status(400).json({ 
            error: 'Tipo di segnalazione non valido',
            validReportTypes
        });
    }

    //Validazione del sottotipo per PROBLEMA_CESTINO
    const validBinSubtypes = ['ROTTO', 'PIENO', 'MANCANTE', 'SPORCO'];
    if (reportType === 'PROBLEMA_CESTINO' && (!reportSubtype || !validBinSubtypes.includes(reportSubtype))) {
        logger.warn(`Sottotipo cestino non valido: ${reportSubtype}`);
        return res.status(400).json({ 
            error: 'Sottotipo cestino non valido',
            validBinSubtypes
        });
    }

    //Validazione del sottotipo per RIFIUTI_ABBANDONATI
    const validWasteSubtypes = [
        'PLASTICA',
        'CARTA',
        'VETRO',
        'ORGANICO',
        'METALLO',
        'ELETTRONICO',
        'INGOMBRANTI',
        'INDIFFERENZIATO',
        'ALTRO'
    ];
    if (reportType === 'RIFIUTI_ABBANDONATI' && (!reportSubtype || !validWasteSubtypes.includes(reportSubtype))) {
        logger.warn(`Sottotipo rifiuto non valido: ${reportSubtype}`);
        return res.status(400).json({ 
            error: 'Sottotipo rifiuto non valido',
            validWasteSubtypes
        });
    }

    //Validazione della gravità
    const validSeverityLevels = ['BASSA', 'MEDIA', 'ALTA', 'URGENTE'];
    if (severity && !validSeverityLevels.includes(severity)) {
        logger.warn(`Livello di gravità non valido: ${severity}`);
        return res.status(400).json({ 
            error: 'Livello di gravità non valido',
            validSeverityLevels
        });
    }

    //Validazione della location
    if (!location || !location.coordinates || !Array.isArray(location.coordinates)) {
        logger.warn('Coordinate non valide');
        return res.status(400).json({ 
            error: 'Le coordinate della posizione sono richieste'
        });
    }

    const [longitude, latitude] = location.coordinates;
    
    //Validazione delle coordinate
    if (isNaN(longitude) || isNaN(latitude) ||
        longitude < -180 || longitude > 180 ||
        latitude < -90 || latitude > 90) {
        logger.warn(`Coordinate non valide: long ${longitude}, lat ${latitude}`);
        return res.status(400).json({ 
            error: 'Coordinate non valide'
        });
    }

    // Validazione dettagli raccolta saltata
    if (reportType === 'RACCOLTA_SALTATA') {
        const { missedCollectionDetails } = req.body;
        const validWasteTypes = [
            'PLASTICA',
            'CARTA',
            'VETRO',
            'ORGANICO',
            'RAEEE',
            'INDIFFERENZIATO'
        ];

        if (!missedCollectionDetails || !missedCollectionDetails.wasteType || 
            !validWasteTypes.includes(missedCollectionDetails.wasteType)) {
            logger.warn(`Dettagli raccolta saltata non validi: ${JSON.stringify(missedCollectionDetails)}`);
            return res.status(400).json({ 
                error: 'Dettagli raccolta saltata non validi o mancanti',
                validWasteTypes
            });
        }

        if (!missedCollectionDetails.scheduledDate) {
            return res.status(400).json({ 
                error: 'Data programmata della raccolta richiesta'
            });
        }
    }
    next();
}; 