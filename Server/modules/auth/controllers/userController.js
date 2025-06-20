import User from "../models/User.js";
import bcrypt from "bcryptjs"; //Password Hash
import { logger } from '../../../core/utils/logger.js';
import jwt from 'jsonwebtoken';
import Token from "../models/Token.js";
import AuthService from "../services/AuthService.js";

//Regex per  validità password
const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'amministratore') {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }

    // Get all users except their passwords
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Errore nel recupero degli utenti' });
  }
};

// Delete user by ID (admin only)
export const deleteUserById = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'amministratore') {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }

    const { userId } = req.params;

    // Don't allow deleting own account
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Non puoi eliminare il tuo account' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    // Don't allow deleting other admins
    if (user.role === 'amministratore') {
      return res.status(403).json({ error: 'Non puoi eliminare altri amministratori' });
    }

    await User.findByIdAndDelete(userId);
    return res.json({ message: 'Utente eliminato con successo' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Errore nell\'eliminazione dell\'utente' });
  }
};

// Update user by ID (admin only)
export const updateUserById = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'amministratore') {
      return res.status(403).json({ error: 'Accesso non autorizzato' });
    }

    const { userId } = req.params;
    const updateData = req.body;

    // Don't allow updating own account through this endpoint
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Usa l\'endpoint di aggiornamento profilo per il tuo account' });
    }

    // Set blockedAt timestamp when deactivating a user
    if (updateData.hasOwnProperty('isActive')) {
      if (!updateData.isActive) {
        updateData.blockedAt = new Date();
      } else {
        updateData.blockedAt = null;  // Clear blockedAt when reactivating
      }
    }

    // If password is provided, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Get the user before update to check if role is being changed
    const existingUser = await User.findById(userId).select('-password');
    if (!existingUser) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    // If role was changed, we'll return this info to the frontend
    const roleChanged = updateData.role && existingUser.role !== updateData.role;
    
    return res.json({
      ...user.toObject(),
      roleChanged,
      previousRole: roleChanged ? existingUser.role : undefined
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    return res.status(500).json({ error: 'Errore nell\'aggiornamento dell\'utente' });
  }
};

//Metodo di login
export const login = async(req, res) => {
    try {
        const user = req.user;   //dopo essersi autenticato
        
        if (!user) {
            logger.error('No user object found in request');
            return res.status(401).json({ error: 'Credenziali non valide' });
        }

        //Generate the tokens via AuthService
        try {
            const { accessToken, refreshToken } = await AuthService.generateTokens(user, req.ip, req.headers['user-agent']);
            logger.info('Generated tokens for user:', { userId: user._id });

            //Aggiorna lastLogin
            user.lastLogin = Date.now();
            await user.save();

            logger.info(`Utente loggato (JWT emesso): ${user._id}, access token ${accessToken},\n refresh token ${refreshToken}`);
            return res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                }
            });
        } catch (tokenError) {
            logger.error('Errore durante la generazione del token:', tokenError);
            return res.status(500).json({ error: 'Errore durante la generazione del token' });
        }
    } catch (error) {
        logger.error('Errore durante il login:', error);
        return res.status(500).json({ error: 'Errore durante il login' });
    }
};

//Add refresh token endpoint
export const refreshTokenHandler = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token mancante' });
        }

        // Verify refresh token JWT
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        // Find all valid tokens for the user
        const storedTokens = await Token.find({
            user: decoded.id,
            revoked: false,
            expiresAt: { $gt: new Date() }
        }).populate('user');

        // Find the matching token
        let validToken = null;
        for (const token of storedTokens) {
            if (await token.verifyToken(refreshToken)) {
                validToken = token;
                break;
            }
        }

        if (!validToken) {
            return res.status(401).json({ error: 'Refresh token non valido' });
                /*
                const token = user.generateAuthToken();
                logger.info('Generated token for user:', { userId: user._id, token });

                //Aggiorna lastLogin
                user.lastLogin = Date.now();
                await user.save();

                logger.info(`Utente loggato (JWT emesso): ${user._id}`);
                return res.json({
                    token,
                    user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                    }
                */
        }            
        // Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await AuthService.generateTokens(
            validToken.user,
            validToken.ipAddress,
            validToken.userAgent
        );

        // Revoke old refresh token
        await Token.findByIdAndUpdate(validToken._id, { revoked: true });

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900 // 15 minutes in seconds
        });
    } catch (error) {
        logger.error('Errore refresh token:', error);
        res.status(401).json({ error: 'Token non valido' });
    }
};

//Metodo di registrazione
export const register = async (req, res) => {
    console.log('--- Register function called ---'); // ENTRY
    try {
        logger.info('Ricevuta richiesta di registrazione:', req.body);
        console.log('Register input:', req.body); // DEBUG
        const { username, email, password, fullName } = req.body;

        // Validazione password
        if (!REGEX_PASSWORD.test(password)) {
            logger.warn('Password non valida durante la registrazione');
            console.log('Password validation failed:', password); // DEBUG
            return res.status(400).json({
                error: 'La password deve contenere almeno 8 caratteri, una lettera maiuscola e un carattere speciale[!@#$%^&*]'
            });
        }
        console.log('Password validation passed'); // DEBUG

        // Verifica se l'utente esiste già
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            logger.warn(`Tentativo di registrazione con email/username già esistente: ${email}`);
            console.log('Existing user found:', existingUser); // DEBUG
            return res.status(400).json({
                error: 'Un utente con questa email o username esiste già'
            });
        }
        console.log('No existing user found'); // DEBUG

        // Validazione fullName
        if (!fullName || !fullName.name || !fullName.surname) {
            logger.warn('Dati nome/cognome mancanti durante la registrazione');
            console.log('Full name validation failed:', fullName); // DEBUG
            return res.status(400).json({
                error: 'Nome e cognome sono obbligatori'
            });
        }
        console.log('Full name validation passed:', fullName); // DEBUG

        // Hash della password
        const salt = await bcrypt.genSalt(10);
        console.log('Salt generated:', salt); // DEBUG
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Password hashed:', hashedPassword); // DEBUG

        // Creazione nuovo utente
        const user = new User({
            username,
            email,
            password: hashedPassword,
            fullName: {
                name: fullName.name,
                surname: fullName.surname
            },
            authMethods: {
                local: true, // Set to true for regular registration
                google: {
                    enabled: false
                }
            }
        });
        console.log('User instance created:', user); // DEBUG

        logger.info('Tentativo di salvare nuovo utente nel database');
        console.log('Saving user to database...'); // DEBUG
        const savedUser = await user.save();
        logger.info(`Nuovo utente registrato con successo: ${savedUser._id}`);
        console.log('User saved:', savedUser); // DEBUG

        console.log('--- Register function completed successfully ---'); // EXIT
        return res.status(201).json({
            message: 'Registrazione completata con successo',
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                fullName: savedUser.fullName
            }
        });

    } catch (error) {
        logger.error('Errore durante la registrazione:', error);
        console.log('--- Register function ERROR ---'); // ERROR ENTRY
        console.log('Registration error:', error); // DEBUG
        if (error.errors) {
            console.log('Validation errors:', error.errors); // DEBUG
        }
        console.log('--- Register function EXIT with error ---'); // ERROR EXIT
        return res.status(500).json({
            error: 'Si è verificato un errore durante la registrazione. Riprova più tardi.'
        });
    }
};


//Aggiornamento profilo con audit
export const profile_update = async (req, res) => {
    try {
        // Validazione dati di input
        const { fullName, username } = req.body;
        
        if (fullName && (!fullName.name || !fullName.surname)) {
            return res.status(400).json({
                error: 'Nome e cognome sono obbligatori'
            });
        }

        if (username && username.length < 3) {
            return res.status(400).json({
                error: 'Username deve avere almeno 3 caratteri'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        logger.info(`Profilo aggiornato per utente: ${user._id}`);
        res.json({
            message: 'Profilo aggiornato con successo',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Errore durante l\'aggiornamento del profilo:', error);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento del profilo' });
    }
};

//Cambio password con audit
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validazione input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Password attuale e nuova password sono obbligatorie'
            });
        }
        
        // Validazione complessità password
        if (!REGEX_PASSWORD.test(newPassword)) {
            return res.status(400).json({
                error: 'La password deve contenere almeno 8 caratteri, una lettera maiuscola e un carattere speciale'
            });
        }
        
        // Get user ID from request
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Utente non autenticato' });
        }

        // Find user and explicitly select password field
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Check if user can change password
        if (!user.canChangePassword()) {
            return res.status(400).json({
                error: 'Non puoi cambiare la password se hai effettuato l\'accesso con Google'
            });
        }
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Password attuale non corretta' });
        }

        // Revoke all existing refresh tokens
        await Token.revokeAllUserTokens(userId);

        // Hash new password and save
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordChangedAt = Date.now();
        await user.save();

        logger.info(`Password cambiata per utente: ${userId}`);
        res.json({ message: 'Password cambiata con successo' });
    } catch (error) {
        logger.error('Errore durante il cambio password:', error);
        res.status(500).json({ error: 'Errore durante il cambio password' });
    }
};

//Eliminazione utente
export const user_delete = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Utente non autenticato' });
        }

        // Find user to verify existence
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // Revoke all tokens before deleting user
        await Token.revokeAllUserTokens(userId);

        // Delete user
        await User.findByIdAndDelete(userId);
        
        logger.info(`Utente eliminato: ${userId}`);
        res.json({ message: 'Utente eliminato con successo' });
    } catch (error) {
        logger.error('Errore durante l\'eliminazione dell\'utente:', error);
        res.status(500).json({ error: 'Errore durante l\'eliminazione dell\'utente' });
    }
};

//Logout endpoint
export const logout = async (req, res) => {
    try {
        const { refreshToken, logoutAll } = req.body;
        
        if (!refreshToken && !logoutAll) {
            return res.status(400).json({ error: 'Refresh token mancante o specificare logoutAll' });
        }

        if (logoutAll) {
            // Revoke all tokens for the user
            await Token.revokeAllUserTokens(req.user._id);
            return res.json({ message: 'Logout da tutti i dispositivi effettuato con successo' });
        }

        // Find and revoke the specific token
        const token = await Token.findOne({ 
            refreshToken,
            user: req.user._id,
            revoked: false 
        });
        
        if (token) {
            token.revoked = true;
            await token.save();
            return res.json({ message: 'Logout effettuato con successo' });
        }

        res.json({ message: 'Token non trovato o già revocato' });
    } catch (error) {
        logger.error('Errore durante il logout:', error);
        res.status(500).json({ error: 'Errore durante il logout' });
    }
};

// Get own profile
export const getOwnProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
};
