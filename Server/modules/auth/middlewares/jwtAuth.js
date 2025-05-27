import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../../../core/utils/logger.js';

//Mock del middleware JWT per testing e sviluppo
export const jwtAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            logger.debug("Header Authorization non valido");
            return res.status(401).json({ 
                error: "Token mancante",
                code: "TOKEN_MISSING"
            });
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                logger.error('User not found for ID:', decoded.id);
                return res.status(401).json({ 
                    error: "Utente non trovato",
                    code: "USER_NOT_FOUND"
                });
            }

            req.user = user;
            next();
        } catch (error) {
            logger.error("Errore JWT Auth:", error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: "Token scaduto",
                    code: "TOKEN_EXPIRED"
                });
            }
            
            return res.status(401).json({ 
                error: "Token non valido",
                code: "TOKEN_INVALID"
            });
        }
    } catch (error) {
        logger.error("Errore generico JWT Auth:", error);
        return res.status(500).json({ 
            error: "Errore interno del server",
            code: "SERVER_ERROR"
        });
    }
}; 