import logger from "../utils/logger";
import User from "../../modules/auth/models/User.js";
import auditService from "../../modules/audit/services/audit.service.js"; //FIX: Aggiunto percorso per l'audit.service 
import bcrypt from "bcryptjs";

//Funzione per l'autenticazione di base
//FIX: La funzione accetta req come parametro 
const authenticateBasic = async(identifier, password, req) => {
    try{
        // Determina se è email o username
        const isEmail = /\S+@\S+\.\S+/.test(identifier);
        const method = isEmail ? 'email' : 'username';
        
        const user = await (User.findOne({
            $or : [
            { email: identifier },
            { username: identifier}
            ]
        }).select('+password'));

        // Registra nel log con il metodo corretto
        logger.info(`Tentativo login via ${method}: ${identifier}`);

        //Verifica utente e corrispondenza password
        if(!user || !(await bcrypt.compare(password, user.password))) {
            await auditService.logFailedAttempt('login', new Error('Credenziali non valide'), {
                identifier,
                method,
                ip: req.ip,
                device: req.headers['user-agent']
              });
              return null;
        }

        // Registra login riuscito
        await auditService.logEvent({
            action: 'login',
            user: user._id,
            method,
            ip: req.ip,
            device: req.headers['user-agent']
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
        const authHeader = req.authHeader.authorization;

        //Verifica presenza e formato corretto dell'header
        if(!authHeader?.startsWith('Basic ')) {
            logger.debug("Header Authorizaion non valdio");
            return res.status(401).json({error: "Autenticazione richiesta"});
        }

        //Decodificazione credenziali
        const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
        const [identifier, password] = credentials.split(':'); //Separa identifier e password

        //Esegue l'autenticazione
        const user = await authenticateBasic(identifier, password);

        //Gestione fallimento autenticazione
        if(!user) return res.status(401).json({ error: "Credenziali non valide" });

        //Aggiunge l'utente autenticato alla request
        req.user = user;
        next(); //Procede al prossimo middleware/controller
    } catch(error){
        //gestion errori generici
        logger.error("Errore middleware auth: " + error.stack);
        res.status(500).json({ error: "Errore interno del server" });
    }
}