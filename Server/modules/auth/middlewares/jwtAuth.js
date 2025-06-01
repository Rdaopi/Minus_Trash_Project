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
            // Check if user is blocked
            if (user.isActive === false) {
                const blockedDate = user.blockedAt ? user.blockedAt.toLocaleString('it-IT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'data sconosciuta';
                
                logger.warn(`Tentativo di accesso da account bloccato: ${user._id}`);
                return res.status(403).json({ 
                    error: `Il tuo account è stato bloccato il ${blockedDate}`
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