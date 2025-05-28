import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../../../core/utils/logger.js';

export const jwtAuth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token di autenticazione mancante' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'your-secret-key');
            
            // Get user from database
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ error: 'Utente non trovato' });
            }

            // Add user to request
            req.user = user;
            next();
        } catch (error) {
            logger.error('Error verifying JWT:', error);
            return res.status(401).json({ error: 'Token non valido' });
        }
    } catch (error) {
        logger.error('JWT Auth Error:', error);
        return res.status(500).json({ error: 'Errore di autenticazione' });
    }
}; 