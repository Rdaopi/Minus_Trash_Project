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