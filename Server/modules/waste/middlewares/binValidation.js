import { logger } from '../../../core/utils/logger.js';

export const validateBin = (req, res, next) => {
    const { type, capacity, location, serialNumber, manufacturer } = req.body;

    //Validazione del tipo di cestino
    const validTypes = ['INDIFFERENZIATO', 'PLASTICA', 'CARTA', 'VETRO', 'ORGANICO', 'METALLO', 'RAEE'];
    if (!type || !validTypes.includes(type)) {
        logger.warn(`Tipo di cestino non valido: ${type}`);
        return res.status(400).json({ 
            error: 'Tipo di cestino non valido',
            validTypes
        });
    }

    //Validazione della capacità
    if (!capacity || isNaN(capacity) || capacity <= 0) {
        logger.warn(`Capacità non valida: ${capacity}`);
        return res.status(400).json({ 
            error: 'La capacità deve essere un numero positivo'
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

    //Validazione del serial number
    if (!serialNumber || typeof serialNumber !== 'string' || serialNumber.length < 6) {
        logger.warn(`Serial number non valido: ${serialNumber}`);
        return res.status(400).json({ 
            error: 'Serial number non valido o mancante'
        });
    }

    //Validazione del produttore
    if (!manufacturer || typeof manufacturer !== 'string') {
        logger.warn(`Produttore non valido: ${manufacturer}`);
        return res.status(400).json({ 
            error: 'Produttore non valido o mancante'
        });
    }

    next();
}; 