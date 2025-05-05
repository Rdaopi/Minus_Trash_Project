import logger from "../utils/logger";
import User from "../../modules/auth/models/User";
import bcrypt from "bcryptjs";

//Funzione per l'autenticazione di base
const authenticateBasic = async(identifier, password) => {
    try{
        const user = await (User.findOne({ email }).select('+password'));

        //Verifica utente e corrispondenza password
        if(!user || !(await bcrypt.compare(password, user.password))) {
            logger.warn("Tentativo accesso fallito per: " + email);
            return null;
        }

        logger.info("Accesso riuscito per: " + email);
        //Ritorna l'utente autenticato
        return user;
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
        if(!authHeader?.startsWIth('Basic ')) {
            logger.debug("Header Authorizaion non valdio");
            return res.status(401).json({error: "Autenticazione richiesta"});
        }

        //Decodificazione credenziali
        const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
        const [email, password] = credentials.split(':'); //Separa mail e password

        //Esegue l'autenticazione
        const user = await authenticateBasic(email, password);

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