import User from "../models/User.js";
import bcrypt from "bcryptjs"; //Password Hash
import { auditOnSuccess } from "../middlewares/withAudit.js"; //per generare gli audit di registrazione
import { logger } from '../../../core/utils/logger.js';
import jwt from 'jsonwebtoken';
import Token from "../models/Token.js";

//Regex per  validità password
const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;

//Metodo di login
export const login = async(req, res) => {
    try {
        const user = req.user;   //dopo essersi autenticato
        
        if (!user) {
            logger.error('No user object found in request');
            return res.status(401).json({ error: 'Credenziali non valide' });
        }

        //Genera il JWT via metodo sullo schema
        try {
            const { accessToken, refreshToken } = await user.generateTokens(req.ip, req.headers['user-agent']);
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
                    fullName: user.fullName
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
        }

        // Generate new tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await validToken.user.generateTokens(
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
    try {
        logger.info('Ricevuta richiesta di registrazione:', req.body);
        const { username, email, password, fullName } = req.body;

        // Validazione password
        if (!REGEX_PASSWORD.test(password)) {
            logger.warn('Password non valida durante la registrazione');
            return res.status(400).json({
                error: 'La password deve contenere almeno 8 caratteri, una lettera maiuscola e un carattere speciale[!@#$%^&*]'
            });
        }

        // Verifica se l'utente esiste già
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            logger.warn(`Tentativo di registrazione con email/username già esistente: ${email}`);
            return res.status(400).json({
                error: 'Un utente con questa email o username esiste già'
            });
        }

        // Validazione fullName
        if (!fullName || !fullName.name || !fullName.surname) {
            logger.warn('Dati nome/cognome mancanti durante la registrazione');
            return res.status(400).json({
                error: 'Nome e cognome sono obbligatori'
            });
        }

        // Hash della password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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

        logger.info('Tentativo di salvare nuovo utente nel database');
        const savedUser = await user.save();
        logger.info(`Nuovo utente registrato con successo: ${savedUser._id}`);

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
        return res.status(500).json({
            error: 'Si è verificato un errore durante la registrazione. Riprova più tardi.'
        });
    }
};


//Aggiornamento profilo con audit
export const profile_update = [
    auditOnSuccess('profile_update', ['userId']),
    async(req, res) => {
        try{
            const user = await User.findByIdAndUpdate(
                req.user._id,
                { $set: req.body },
                { new: true, runValidators: true}
            ).select('-password');

            res.json(user);
        } catch(error){
            error.statusCode = 500;
            throw error;
        }
    }
];

//Cambio password con audit
export const changePassword = [
    auditOnSuccess('password_change'),
    async(req, res) => {
        try {
            const {currentPassword, newPassword} = req.body;
            
            // Add logging to debug
            console.log('User from request:', req.user);
            
            // Make sure we're getting the user ID correctly
            const userId = req.user?._id;
            if (!userId) {
                throw new Error('User ID not found in request');
            }

            // Find user and explicitly select password field
            const user = await User.findById(userId).select('+password');
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user can change password
            if (!user.canChangePassword()) {
                throw new Error('Non puoi cambiare la password se hai effettuato l\'accesso con Google');
            }

            //Validazione complessità password
            if(!REGEX_PASSWORD.test(newPassword)) {
                const error = new Error("Password deve contenere 8+ caratteri, 1 maiuscola e 1 simbolo [!@#$%^&*]");
                error.statusCode = 400;
                throw error;
            }
            
            if(!await bcrypt.compare(currentPassword, user.password)) {
                const error = new Error("Password corrente non valida");
                error.statusCode = 401;
                throw error;
            }

            // Revoke all existing refresh tokens
            await Token.revokeAllUserTokens(userId);

            user.password = await bcrypt.hash(newPassword, 12);
            user.passwordChangedAt = Date.now();
            await user.save();

            res.json({ message: "Password aggiornata con successo" });
        } catch (error) {
            console.error('Password change error:', error);
            error.statusCode = error.statusCode || 500;
            res.status(error.statusCode).json({ error: error.message });
        }
    }
];

//Eliminazione utente
export const user_delete = [
    auditOnSuccess('user_delete'),
    async(req,res) => {
        try {
            await User.findByIdAndDelete(req.user._id);
            res.json( {message: "Utente eliminato con successo"});
        }catch(error) {
            error.statusCode = 500;
            throw error;
        }
    }
];

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