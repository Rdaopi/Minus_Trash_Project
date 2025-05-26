import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../../../core/utils/logger.js';

//Mock del middleware JWT per testing e sviluppo
export const jwtAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            logger.debug("Header Authorization non valido");
            return res.status(401).json({ error: "Token mancante" });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        // Add logging to debug
        console.log('Decoded token:', decoded);
        
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            logger.error('User not found for ID:', decoded.id);
            return res.status(401).json({ error: "Utente non trovato" });
        }

        // Add logging to debug
        console.log('Found user:', user);

        req.user = user;
        next();
    } catch (error) {
        logger.error("Errore JWT Auth:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token scaduto" });
        }
        return res.status(401).json({ error: "Token non valido" });
    }
}; 