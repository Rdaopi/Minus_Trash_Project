import jwt from 'jsonwebtoken';

const generateTokens = async (user, ip, userAgent) => {
    try {
        const accessToken = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_ACCESS_SECRET,
          { expiresIn: '15m' }
        );

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
        );

  // Salva il refresh token nel database
  await Token.create({
    user: user._id,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: ip,
    userAgent
  });

  return { accessToken, refreshToken };
    } catch (error) {
        logger.error(`Errore generazione token: ${error.stack}`);
        throw new Error('Errore generazione token');
    }    
};
// 2. Modifica la funzione login
export const login = async (req, res) => {
  try {
    const user = await authenticateBasic(req.body.identifier, req.body.password);
    
    const { accessToken, refreshToken } =await  generateTokens(
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

// Nuovo endpoint per refresh token
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    // Verifica token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Cerca token nel database
    const storedToken = await Token.findOne({
      refreshToken,
      user: decoded.id,
      revoked: false,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!storedToken) {
      return res.status(401).json({ error: 'Refresh token non valido' });
    }

    // Genera nuovi token
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      storedToken.user,
      storedToken.ipAddress,
      storedToken.userAgent
    );

    // Revoca il vecchio refresh token
    await Token.findByIdAndUpdate(storedToken._id, { revoked: true });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900
    });

  } catch (error) {
    res.status(401).json({ error: 'Token non valido' });
  }
};

// Middleware di autenticazione aggiornato
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