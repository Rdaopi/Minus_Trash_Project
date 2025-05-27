import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Token from '../models/Token.js';
import { logger } from '../../../core/utils/logger.js';
import { authenticateBasic } from '../services/authService.js';

// 2. Modifica la funzione login
export const login = async (req, res) => {
  try {
    const user = await authenticateBasic(req.body.identifier, req.body.password);
    
    const { accessToken, refreshToken } = await user.generateTokens(
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

// Nuovo endpoint per refresh token
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    if (!refreshToken) {
      logger.error('Refresh token mancante nella richiesta');
      return res.status(400).json({ error: 'Refresh token mancante' });
    }

    // Verifica token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Cerca token nel database
    const storedToken = await Token.findOne({
      user: decoded.id,
      revoked: false,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!storedToken) {
      logger.error('Token non trovato nel database o revocato');
      return res.status(401).json({ error: 'Refresh token non valido' });
    }

    // Verifica il token
    const isValid = await storedToken.verifyToken(refreshToken);
    if (!isValid) {
      logger.error('Token non valido durante la verifica');
      return res.status(401).json({ error: 'Refresh token non valido' });
    }

    // Genera nuovi token
    const { accessToken, refreshToken: newRefreshToken } = await storedToken.user.generateTokens(
      storedToken.ipAddress,
      storedToken.userAgent
    );

    // Revoca il vecchio refresh token
    await Token.findByIdAndUpdate(storedToken._id, { revoked: true });

    logger.info('Nuovi token generati con successo');
    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900
    });

  } catch (error) {
    logger.error('Errore durante il refresh del token:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token scaduto' });
    }
    res.status(401).json({ error: 'Token non valido' });
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