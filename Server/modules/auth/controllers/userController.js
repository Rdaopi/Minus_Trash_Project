import logger from "../../../core/utils/logger";
import User from "../models/User";
import bcrypt from "bcryptjs";

//Test validità password
const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    return regex.test(password);
};

//Registazione nuovo utente
export const register = async (req, res) => {
    try {
        const { username, email, password} = req.body;

        //Validazione complessità password
        if(!validatePassword(password)) {
            logger.warn('Formato password non valido per: ' + email);
            return res.status(400).json({
                error: "Password deve contenere 8+ caratteri, 1 maiuscola e 1 simbolo"
            });
        }

        //Verifica unicità email
        const existUser = await User.findOne({ email });
        if(existUser) {
            logger.warn('Registrazione fallita: ' + email + " già esistente");
            return res.status(409).json({
                error: "Email già registrata"
            });
        }

        //Verifica unicità username
        const existingUsername = await User.findOne( {username });
        if(existingUsername) {
            return res.status(409).json( { error: "Username già in uso" });
        }

        //Creazione utente con password hashata
        const user = await User.create({
            email,
            password: await bcrypt.hash(password, 12) //Salt
        });

        //Log evento e risposta "nuovo utente"
        logger.info("Nuovo utente registrato: " + user_id);
        res.status(201).json({
            id: user_id,
            email: user.email
        });

    } catch(error) {
        logger.error("Errore registrazione: " + error.stack);
        res.status(500).json({
            error:"Errore durante la registrazione"
        });
    }
}

//FIX: Esportazione dei metodi del controller
export default {
    register
};


//--------------------------------------------------
// modules/auth/controllers/userController.js
import { body, validationResult } from 'express-validator';
import auditService from '../../audit/services/audit.service.js';

// Middleware di validazione
export const updateCredentialsValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Password corrente obbligatoria')
    .isLength({ min: 8 }).withMessage('Password corrente non valida'),
  body('newEmail')
    .optional()
    .isEmail().withMessage('Email non valida')
    .normalizeEmail(),
  body('newUsername')
    .optional()
    .isLength({ min: 3, max: 30 }).withMessage('Username deve essere tra 3-30 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username contiene caratteri non validi'),
  body('newPassword')
    .optional()
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }).withMessage('La nuova password deve contenere almeno 8 caratteri, 1 maiuscola, 1 numero e 1 simbolo')
];

// Controller per aggiornamento credenziali
export const updateCredentials = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newEmail, newUsername, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    // Verifica password corrente
    if (!(await user.comparePassword(currentPassword))) {
      await auditService.logFailedAttempt('update_credentials', 
        new Error('Password corrente errata'), {
          userId: user._id,
          ip: req.ip,
          device: req.headers['user-agent']
        });
      return res.status(401).json({ error: 'Password corrente non valida' });
    }

    // Preparazione modifiche
    const updates = {};
    const auditChanges = [];

    // Aggiornamento email
    if (newEmail && newEmail !== user.email) {
      const emailExists = await User.findOne({ email: newEmail });
      if (emailExists) {
        return res.status(409).json({ error: 'Email già registrata' });
      }
      updates.email = newEmail;
      auditChanges.push(`email: ${user.email} → ${newEmail}`);
      user.emailVerified = false; // Richiede nuova verifica
    }

    // Aggiornamento username
    if (newUsername && newUsername !== user.username) {
      const usernameExists = await User.findOne({ username: newUsername });
      if (usernameExists) {
        return res.status(409).json({ error: 'Username già in uso' });
      }
      updates.username = newUsername;
      auditChanges.push(`username: ${user.username} → ${newUsername}`);
    }

    // Aggiornamento password
    if (newPassword) {
      updates.password = newPassword;
      updates.passwordChangedAt = Date.now();
      auditChanges.push('password aggiornata');
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nessuna modifica fornita' });
    }

    // Applica modifiche
    Object.assign(user, updates);
    await user.save();

    // Log audit
    await auditService.logEvent({
      action: 'credentials_update',
      user: user._id,
      ip: req.ip,
      device: req.headers['user-agent'],
      metadata: {
        changes: auditChanges,
        initiatedBy: user._id
      }
    });

    // Invalida token esistenti se cambia password o email
    if (newPassword || newEmail) {
      await Token.deleteMany({ userId: user._id });
    }

    res.json({ 
      message: 'Credenziali aggiornate con successo',
      changes: auditChanges
    });

  } catch (error) {
    logger.error(`Errore aggiornamento credenziali: ${error.stack}`);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento' });
  }
};
