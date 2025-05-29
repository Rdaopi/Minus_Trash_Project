import { logger } from "../../../core/utils/logger.js";
import User from "../models/User.js";
import auditService from "../../audit/services/audit.service.js"; //FIX: Aggiunto percorso per l'audit.service 
import bcrypt from "bcryptjs";

//Funzione per l'autenticazione di b
const authenticateBasic = async (identifier, password, req) => {
    try {
        // For regular users, we only accept email login
        const user = await User.findOne({ email: identifier }).select('+password');

        // Registra nel log
        logger.info(`Tentativo login via email: ${identifier}`);

        //Verifica utente e corrispondenza password
        if (!user || !(await bcrypt.compare(password, user?.password || ''))) {
            await auditService.logFailedAttempt('login', new Error('Credenziali non valide'), {
                identifier: identifier,
                method: 'email',
                ip: req.ip || 'unknown',
                device: req.headers?.['user-agent'] || 'unknown'
            });
            return null;
        }

        // Registra login riuscito
        await auditService.logEvent({
            action: 'login',
            user: user._id,
            method: 'email',
            ip: req.ip || 'unknown',
            device: req.headers?.['user-agent'] || 'unknown',
            success: true,
            email: user.email
        });

        return user;//Ritorna l'utente autenticato

    } catch (error) {
        logger.error("Errore autenticazione: " + error.stack);
        throw error;
    }
}

//Middleware di autenticazione principale
export const basicAuth = async (req, res, next) => {
    try {
        //Estrae l'header di autorizzazione
        const authHeader = req.headers.authorization;

        //Verifica presenza e formato corretto dell'header
        if (!authHeader?.startsWith('Basic ')) {
            logger.debug("Header Authorizaion non valdio");
            return res.status(401).json({ error: "Autenticazione richiesta" });
        }

        //Decodificazione credenziali
        const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
        const [identifier, password] = credentials.split(':'); //Separa identifier e password

        //Esegue l'autenticazione
        const user = await authenticateBasic(identifier, password, req);

        //Gestione fallimento autenticazione
        if (!user) return res.status(401).json({ error: "Credenziali non valide" });

        //Aggiunge l'utente autenticato alla request
        req.user = user;
        next(); //Procede al prossimo middleware/controller
    } catch (error) {
        //gestione errori generici
        logger.error("Errore middleware auth: " + error.stack);
        res.status(500).json({ error: "Errore interno del server" });
    }
}