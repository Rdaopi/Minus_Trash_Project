import User from "../models/User.js";
import bcrypt from "bcryptjs"; //Password Hash
import { auditOnSuccess } from "../middlewares/withAudit.js"; //per generare gli audit di registrazione
import { logger } from '../../../core/utils/logger.js';

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

//Metodo di registrazione
export const register = async (req, res) => {
    try {
        logger.info('Ricevuta richiesta di registrazione:', req.body);
        const { username, email, password, fullName } = req.body;

        // Validazione password
        if (!REGEX_PASSWORD.test(password)) {
            logger.warn('Password non valida durante la registrazione');
            return res.status(400).json({
                error: 'La password deve contenere almeno 8 caratteri, una lettera maiuscola e un carattere speciale'
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
        try{
            const {currentPassword, newPassword} = req.body;
            const user = await User.findById(req.user._id).select('+password');
            //Validazione complessità password
            if(!REGEX_PASSWORD.test(newPassword)) {
                const error = new Error("Password deve contenere 8+ caratteri, 1 maiuscola e 1 simbolo");
                error.statusCode = 400;
                throw error;
            };
            
            if(!await bcrypt.compare(currentPassword, user.password)) {
                const error = new Error("Password corrente non valida");
                error.statusCode = 401;
                throw error;
            }

            user.password = await bcrypt.hash(newPassword,12);
            await user.save();
            user.passwordChangedAt = Date.now();

            res.json( { message: "Passoword aggiornata con successo" });
        }catch(error){
            error.statusCode = error.statusCode || 500;
            throw error;
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

//Modifica ruolo utente (solo per amministratori)
export const updateUserRole = async(req, res) => {
    try {
        // Verifica che l'utente richiedente sia un amministratore
        /* Temporarily disabled admin check
        if (req.user.role !== "amministratore") {
            return res.status(403).json({ error: 'Solo gli amministratori possono modificare i ruoli' });
        }
        */

        const { userId, newRole } = req.body;

        // Verifica che il nuovo ruolo sia valido
        const validRoles = ["cittadino", "operatore_comunale", "amministratore"];
        if (!validRoles.includes(newRole)) {
            return res.status(400).json({ error: 'Ruolo non valido' });
        }

        // Trova e aggiorna l'utente
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role: newRole },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        logger.info(`Ruolo utente ${userId} aggiornato a ${newRole} da utente ${req.user._id}`);
        res.json(updatedUser);
    } catch (error) {
        logger.error('Errore durante l\'aggiornamento del ruolo:', error);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento del ruolo' });
    }
};