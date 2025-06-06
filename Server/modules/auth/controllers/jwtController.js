import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Token from '../models/Token.js';
import AuthService from '../services/AuthService.js';
import { logger } from '../../../core/utils/logger.js';
import { authenticateBasic } from '../services/AuthService.js';

// 2. Modifica la funzione login
export const login = async (req, res) => {
  try {
    const user = await authenticateBasic(req.body.identifier, req.body.password);
    
    const { accessToken, refreshToken } = await AuthService.generateTokens(
      user,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minuti in secondi
    });

  } catch (error) {
    logger.error(`Errore login: ${error.stack}`);
    res.status(500).json({ error: 'Errore durante il login' });
  }
};

// Middleware di autenticazione   
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token mancante' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) return res.status(401).json({ error: 'Utente non trovato' });
    
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ error: 'Password modificata, effettua il login' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token scaduto' });
    }
    res.status(401).json({ error: 'Token non valido' });
  }
};