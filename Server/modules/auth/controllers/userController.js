import User from "../models/User";
import bcrypt from "bcryptjs"; //Password Hash
import auditOnSuccess from "../middlewares/withAudit.js"; //per generare gli audit di registrazione

//Regex per  validità password
const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;

//Metodo di login
export const login = (req, res) => {
    //Da fare: Generazione il token JWT a seguito dell'autenticazione dell'utente implementata attualmente in basicAuth.js 
}

//Registazione nuovo utente con audit
export const register = [
    auditOnSuccess('user_registration', ['email']),
    async (req, res) => {
    try {
        const { username, email, password} = req.body;

        //Validazione complessità password
        if(!REGEX_PASSWORD.test(password)) {
            return res.status(400).json({
                error: "Password deve contenere 8+ caratteri, 1 maiuscola e 1 simbolo"
            });
        }

        //Verifica unicità email nel database
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
            username,
            email,
            password: await bcrypt.hash(password, 12) //Salt
        });

        //Log evento e risposta "nuovo utente"
        logger.info("Nuovo utente registrato: " + user_id);
        res.status(201).json({
            id: user_id,
            username: user.email,
            email: user.email
        });

    } catch(error) {
        logger.error("Errore registrazione: " + error.stack);
        res.status(500).json({
            error:"Errore durante la registrazione"
        });
    }
}];

//Aggiornamento profilo con audit
export const profile_update = [
    auditOnSuccess('profile_update', ['userId']),
    async(req, res) => {
        try{
            const user = await User.findByIdAndUpdate(
                req.user.user_id,
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
            const user = await User.findById(req.user.user_id).select('+password');

            if(!await bcrypt.compare(currentPassword, user.password)) {
                const error = new Error("Password corrente non valida");
                error.statusCode = 401;
                throw error;
            }

            user.password = await bcrypt.has(newPasseword,12);
            await user.save();

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
            await User.findByIdAndDelete(req.user.user_id);
            res.json( {message: "Utente eliminato con successo"});
        }catch(error) {
            error.statusCode = 500;
            throw error;
        }
    }
];