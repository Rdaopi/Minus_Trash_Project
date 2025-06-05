import express from 'express';
import { basicAuth } from "./middlewares/basicAuth.js";
import { 
  login, 
  register, 
  changePassword, 
  profile_update, 
  refreshTokenHandler, 
  logout,
  getAllUsers,
  deleteUserById,
  updateUserById
} from './controllers/userController.js';

import { auditOnSuccess } from "./middlewares/withAudit.js";
import { googleAuth, googleAuthCallback } from "./middlewares/googleAuth.js";
import { jwtAuth } from "./middlewares/jwtAuth.js";
import User from "./models/User.js";
import Token from "./models/Token.js";
import bcrypt from "bcryptjs";
import { logger } from '../../core/utils/logger.js';
import { forgotPassword, resetPassword } from './controllers/passwordController.js';

const router = express.Router()


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       title: User
 *       description: Rappresenta un utente del sistema Minus Trash
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - fullName
 *         - username
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unico dell'utente
 *           example: "507f1f77bcf86cd799439011"
 *         username:
 *           type: string
 *           description: Nome utente unico per il login
 *           minLength: 3
 *           maxLength: 30
 *           example: "mario_rossi"
 *         fullName:
 *           type: object
 *           description: Nome completo dell'utente
 *           required:
 *             - name
 *             - surname
 *           properties:
 *             name:
 *               type: string
 *               description: Nome dell'utente
 *               minLength: 2
 *               maxLength: 50
 *               example: "Mario"
 *             surname:
 *               type: string
 *               description: Cognome dell'utente
 *               minLength: 2
 *               maxLength: 50
 *               example: "Rossi"
 *         email:
 *           type: string
 *           format: email
 *           description: Indirizzo email dell'utente (deve essere unico)
 *           example: "mario.rossi@email.com"
 *         role:
 *           type: string
 *           description: Ruolo dell'utente nel sistema
 *           enum:
 *             - cittadino
 *             - operatore_comunale
 *             - amministratore
 *           default: cittadino
 *           example: "cittadino"
 *         isActive:
 *           type: boolean
 *           description: Indica se l'account è attivo
 *           default: true
 *           example: true
 *         password:
 *           type: string
 *           description: Password dell'utente (hash, non mostrata nelle risposte)
 *           minLength: 8
 *           writeOnly: true
 *           example: "SecurePass123!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data di creazione dell'account
 *           example: "2023-12-01T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data ultimo aggiornamento
 *           example: "2023-12-01T14:30:00Z"
 *       example:
 *         email: "mario.rossi@email.com"
 *         password: "SecurePass123!"
 *         fullName:
 *           name: "Mario"
 *           surname: "Rossi"
 *         username: "mario_rossi"
 *         role: "cittadino"
 *     
 *     LoginResponse:
 *       title: Login Response
 *       description: Risposta del login con token JWT
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT token per l'autenticazione
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/User'
 *         expiresIn:
 *           type: string
 *           description: Durata del token
 *           example: "24h"
 *       example:
 *         token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           _id: "507f1f77bcf86cd799439011"
 *           username: "mario_rossi"
 *           email: "mario.rossi@email.com"
 *           role: "cittadino"
 *           isActive: true
 *         expiresIn: "24h"
 *     
 *     ErrorResponse:
 *       title: Error Response
 *       description: Risposta di errore standard
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Messaggio di errore
 *           example: "Credenziali non valide"
 *         message:
 *           type: string
 *           description: Messaggio dettagliato
 *           example: "Email o password non corretti"
 *         errors:
 *           type: object
 *           description: Errori di validazione specifici per campo
 *           additionalProperties:
 *             type: array
 *             items:
 *               type: string
 *           example:
 *             email: ["Email già registrata"]
 *             username: ["Username già in uso"]
 */

/**
 * @swagger
 * tags:
 *   name: Autenticazione
 *   description: |
 *     Gestione dell'autenticazione utente, registrazione e login.
 *     Include supporto per login tradizionale e OAuth con Google.
 */

//Registrazione classica
router.post('/register', auditOnSuccess('user_registration', ['email']), register);

//request url: http://localhost:5000/api/auth/register
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrazione nuovo utente
 *     description: |
 *       Crea un nuovo account utente nel sistema Minus Trash.
 *       
 *       **Note importanti:**
 *       - L'email deve essere unica nel sistema
 *       - L'username deve essere unico nel sistema
 *       - La password deve soddisfare i requisiti di sicurezza (min 8 caratteri)
 *       - Il ruolo predefinito è "cittadino"
 *       - L'account viene attivato automaticamente
 *     tags: [Autenticazione]
 *     operationId: registerUser
 *     requestBody:
 *       description: Dati del nuovo utente da registrare
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Indirizzo email (deve essere unico)
 *                 example: "mario.rossi@email.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password (min 8 caratteri)
 *                 example: "SecurePass123!"
 *               fullName:
 *                 type: object
 *                 required:
 *                   - name
 *                   - surname
 *                 properties:
 *                   name:
 *                     type: string
 *                     minLength: 2
 *                     maxLength: 50
 *                     example: "Mario"
 *                   surname:
 *                     type: string
 *                     minLength: 2
 *                     maxLength: 50
 *                     example: "Rossi"
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: Nome utente (deve essere unico)
 *                 example: "mario_rossi"
 *               role:
 *                 type: string
 *                 enum: [cittadino, operatore_comunale, amministratore]
 *                 default: cittadino
 *                 example: "cittadino"
 *           examples:
 *             cittadino:
 *               summary: Registrazione cittadino
 *               description: Esempio di registrazione per un cittadino normale
 *               value:
 *                 email: "mario.rossi@email.com"
 *                 password: "SecurePass123!"
 *                 fullName:
 *                   name: "Mario"
 *                   surname: "Rossi"
 *                 username: "mario_rossi"
 *             operatore:
 *               summary: Registrazione operatore
 *               description: Esempio di registrazione per un operatore comunale
 *               value:
 *                 email: "giuseppe.verdi@comune.roma.it"
 *                 password: "OperatorPass456!"
 *                 fullName:
 *                   name: "Giuseppe"
 *                   surname: "Verdi"
 *                 username: "g_verdi_op"
 *                 role: "operatore_comunale"
 *     responses:
 *       201:
 *         description: Utente registrato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             examples:
 *               success:
 *                 summary: Registrazione completata
 *                 value:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   username: "mario_rossi"
 *                   email: "mario.rossi@email.com"
 *                   fullName:
 *                     name: "Mario"
 *                     surname: "Rossi"
 *                   role: "cittadino"
 *                   isActive: true
 *                   createdAt: "2023-12-01T10:15:00Z"
 *       400:
 *         description: Dati di registrazione non validi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Errori di validazione
 *                 value:
 *                   message: "Dati di registrazione non validi"
 *                   errors:
 *                     email: ["Email già registrata nel sistema"]
 *                     username: ["Username già in uso"]
 *                     password: ["La password deve contenere almeno 8 caratteri"]
 *       409:
 *         description: Conflitto - Utente già esistente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               conflict:
 *                 summary: Utente esistente
 *                 value:
 *                   error: "Utente già esistente"
 *                   message: "Un utente con questa email è già registrato"
 *       500:
 *         description: Errore interno del server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login utente
 *     description: |
 *       Effettua il login di un utente esistente utilizzando **Basic Authentication**.
 *       
 *       **Come usare questo endpoint:**
 *       1. Codifica le credenziali in formato `email:password` in Base64
 *       2. Includi l'header: `Authorization: Basic <credenziali_base64>`
 *       3. Riceverai un JWT token per le successive chiamate API
 *       
 *       **Esempio di codifica Base64:**
 *       - Credenziali: `mario.rossi@email.com:SecurePass123!`
 *       - Base64: `bWFyaW8ucm9zc2lAZW1haWwuY29tOlNlY3VyZVBhc3MxMjMh`
 *       - Header: `Authorization: Basic bWFyaW8ucm9zc2lAZW1haWwuY29tOlNlY3VyZVBhc3MxMjMh`
 *     tags: [Autenticazione]
 *     operationId: loginUser
 *     security:
 *       - BasicAuth: []
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               success_login:
 *                 summary: Login completato
 *                 value:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSJ9..."
 *                   user:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     username: "mario_rossi"
 *                     email: "mario.rossi@email.com"
 *                     role: "cittadino"
 *                     isActive: true
 *                     lastLogin: "2023-12-01T14:30:00Z"
 *                   expiresIn: "24h"
 *       401:
 *         description: Credenziali non valide o account disattivato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_credentials:
 *                 summary: Credenziali errate
 *                 value:
 *                   error: "Credenziali non valide"
 *                   message: "Email o password non corretti"
 *               account_blocked:
 *                 summary: Account bloccato
 *                 value:
 *                   error: "Account bloccato"
 *                   message: "Il tuo account è stato temporaneamente sospeso"
 *       422:
 *         description: Header Authorization mancante o malformato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_auth:
 *                 summary: Autenticazione mancante
 *                 value:
 *                   error: "Authorization richiesto"
 *                   message: "Header Authorization richiesto per il login"
 */

//Login classico
router.post('/login', basicAuth, login);
//router.post('/login-test', login);
//Temporary testing route that handles authentication directly
router.post('/login-test', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find the user
    const user = await User.findOne({
      $or: [
        { email: email },
        { username: email }
      ]
    }).select('+password');
    
    // Verify user and password match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }
    
    // Add the user to req and proceed to login controller
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore interno del server" });
  }
}, login);
/**
 * @swagger
 * /api/auth/login-test:
 *   post:
 *     summary: Login di test (senza Basic Auth)
 *     description: |
 *       **ENDPOINT DI TEST - Non usare in produzione!**
 *       
 *       Endpoint temporaneo per testare il login senza l'autenticazione Basic.
 *       Accetta direttamente email e password nel body della richiesta.
 *       
 *       **Nota:** Questo endpoint dovrebbe essere rimosso in produzione
 *       e sostituito con il login standard che usa Basic Authentication.
 *     tags: [Autenticazione]
 *     operationId: loginTest
 *     requestBody:
 *       description: Credenziali di login
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dell'utente registrato
 *                 example: "mario.rossi@email.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password dell'utente
 *                 example: "SecurePass123!"
 *           examples:
 *             test_login:
 *               summary: Login di test
 *               value:
 *                 email: "mario.rossi@email.com"
 *                 password: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             examples:
 *               success:
 *                 summary: Login riuscito
 *                 value:
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   user:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     username: "mario_rossi"
 *                     email: "mario.rossi@email.com"
 *                     role: "cittadino"
 *                     isActive: true
 *                   expiresIn: "24h"
 *       401:
 *         description: Credenziali non valide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_credentials:
 *                 summary: Login fallito
 *                 value:
 *                   error: "Credenziali non valide"
 *                   message: "Email o password non corretti"
 *       500:
 *         description: Errore interno del server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

//Registrazione/Login via google
router.get('/googleOAuth/login', googleAuth);
/**
 * @swagger
 * /api/auth/googleOAuth/login:
 *   get:
 *     summary: Inizia autenticazione Google OAuth
 *     description: |
 *       Avvia il flusso di autenticazione OAuth 2.0 con Google.
 *       
 *       **Funzionamento:**
 *       1. L'utente viene reindirizzato alla pagina di autorizzazione Google
 *       2. L'utente accetta i permessi richiesti
 *       3. Google reindirizza al callback con un codice di autorizzazione
 *       4. Il sistema scambia il codice con un token di accesso
 *       5. Viene creato o aggiornato l'account utente
 *       
 *       **Scopes richiesti:**
 *       - `profile`: Informazioni di base del profilo
 *       - `email`: Indirizzo email dell'utente
 *       
 *       **Note:**
 *       - Se l'email Google è già associata a un account, viene effettuato il login
 *       - Se è un nuovo utente, viene creato automaticamente un account
 *       - Il ruolo predefinito per nuovi utenti Google è "cittadino"
 *     tags: [Autenticazione]
 *     operationId: initiateGoogleAuth
 *     responses:
 *       302:
 *         description: Redirect alla pagina di autorizzazione Google
 *         headers:
 *           Location:
 *             description: URL di autorizzazione Google OAuth
 *             schema:
 *               type: string
 *               format: uri
 *               example: "https://accounts.google.com/oauth/authorize?client_id=..."
 *       500:
 *         description: Errore nella configurazione OAuth
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               config_error:
 *                 summary: Errore configurazione
 *                 value:
 *                   error: "OAuth non configurato"
 *                   message: "Le credenziali Google OAuth non sono configurate correttamente"
 */

// Callback Google (GET)
router.get('/googleOAuth/callback', googleAuthCallback);
/**
 * @swagger
 * /api/auth/googleOAuth/callback:
 *   get:
 *     summary: Callback autenticazione Google
 *     description: |
 *       Endpoint di callback per completare il flusso OAuth 2.0 con Google.
 *       
 *       **IMPORTANTE:** Questo endpoint NON deve essere chiamato direttamente!
 *       Viene chiamato automaticamente da Google dopo l'autorizzazione.
 *       
 *       **Processo automatico:**
 *       1. Google reindirizza qui con un codice di autorizzazione
 *       2. Il sistema scambia il codice con i token di accesso Google
 *       3. Vengono recuperate le informazioni dell'utente da Google
 *       4. L'utente viene creato/aggiornato nel database
 *       5. Viene generato un JWT token per l'autenticazione
 *       6. L'utente viene reindirizzato alla dashboard o pagina di successo
 *       
 *       **Gestione errori:**
 *       - Se l'utente nega i permessi, viene reindirizzato a una pagina di errore
 *       - Se ci sono problemi tecnici, viene mostrato un messaggio di errore
 *     tags: [Autenticazione]
 *     operationId: googleAuthCallback
 *     parameters:
 *       - in: query
 *         name: code
 *         required: false
 *         description: Codice di autorizzazione fornito da Google (presente solo se l'utente ha autorizzato)
 *         schema:
 *           type: string
 *           example: "4/0AX4XfWjYQZ1X2Y3Z4..."
 *       - in: query
 *         name: error
 *         required: false
 *         description: Codice di errore (presente solo se l'utente ha negato l'autorizzazione)
 *         schema:
 *           type: string
 *           enum: [access_denied]
 *           example: "access_denied"
 *       - in: query
 *         name: state
 *         required: false
 *         description: Parametro di stato per prevenire attacchi CSRF
 *         schema:
 *           type: string
 *           example: "random_state_value"
 *     responses:
 *       302:
 *         description: Redirect dopo autenticazione completata
 *         headers:
 *           Location:
 *             description: URL di destinazione post-login
 *             schema:
 *               type: string
 *               format: uri
 *               example: "https://app.minustrash.com/dashboard?token=eyJhbGci..."
 *           Set-Cookie:
 *             description: Cookie con JWT token (opzionale)
 *             schema:
 *               type: string
 *               example: "auth_token=eyJhbGciOiJIUzI1NiI...; HttpOnly; Secure"
 *       400:
 *         description: Parametri di callback non validi
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<html><body><h1>Errore di autenticazione</h1><p>Parametri non validi</p></body></html>"
 *       401:
 *         description: Autenticazione Google fallita
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<html><body><h1>Accesso negato</h1><p>Autorizzazione Google non riuscita</p></body></html>"
 *       500:
 *         description: Errore interno durante l'elaborazione del callback
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<html><body><h1>Errore del server</h1><p>Si è verificato un errore tecnico</p></body></html>"
 */

//Route Protette da JWT
//Da implementare con il JWT, attualmente richiede autenticazione base
router.post('/profile_update', jwtAuth, profile_update);
/**
 * @swagger
 * /api/auth/profile_update:
 *   post:
 *     summary: Aggiorna profilo utente
 *     description: |
 *       Permette all'utente autenticato di aggiornare le informazioni del proprio profilo.
 *       
 *       **Campi modificabili:**
 *       - Nome e cognome
 *       - Username (deve essere unico nel sistema)
 *       
 *       **Campi NON modificabili:**
 *       - Email (richiede processo di verifica separato)
 *       - Ruolo (solo gli amministratori possono modificarlo)
 *       - Password (usa endpoint dedicato `/change_password`)
 *       
 *       **Validazioni:**
 *       - L'username deve essere unico
 *       - Nome e cognome devono avere almeno 2 caratteri
 *       - Massimo 50 caratteri per nome e cognome
 *       - Username tra 3 e 30 caratteri
 *     tags: [Autenticazione]
 *     operationId: updateProfile
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: Dati del profilo da aggiornare
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: object
 *                 description: Nome completo dell'utente
 *                 properties:
 *                   name:
 *                     type: string
 *                     minLength: 2
 *                     maxLength: 50
 *                     description: Nome dell'utente
 *                     example: "Mario"
 *                   surname:
 *                     type: string
 *                     minLength: 2
 *                     maxLength: 50
 *                     description: Cognome dell'utente
 *                     example: "Rossi"
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: "^[a-zA-Z0-9_]+$"
 *                 description: Nome utente (solo lettere, numeri e underscore)
 *                 example: "mario_rossi_2024"
 *           examples:
 *             update_name:
 *               summary: Aggiorna solo il nome
 *               value:
 *                 fullName:
 *                   name: "Mario Giuseppe"
 *                   surname: "Rossi"
 *             update_username:
 *               summary: Aggiorna solo username
 *               value:
 *                 username: "mario_rossi_new"
 *             update_all:
 *               summary: Aggiorna tutto
 *               value:
 *                 fullName:
 *                   name: "Mario Giuseppe"
 *                   surname: "Verdi"
 *                 username: "mario_verdi"
 *     responses:
 *       200:
 *         description: Profilo aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profilo aggiornato con successo"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               success:
 *                 summary: Aggiornamento riuscito
 *                 value:
 *                   message: "Profilo aggiornato con successo"
 *                   user:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     username: "mario_verdi"
 *                     email: "mario.rossi@email.com"
 *                     fullName:
 *                       name: "Mario Giuseppe"
 *                       surname: "Verdi"
 *                     role: "cittadino"
 *                     updatedAt: "2023-12-01T16:30:00Z"
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Errore di validazione
 *                 value:
 *                   error: "Dati non validi"
 *                   message: "I dati forniti non rispettano i requisiti"
 *                   errors:
 *                     username: ["Username già in uso da un altro utente"]
 *                     "fullName.name": ["Il nome deve avere almeno 2 caratteri"]
 *       401:
 *         description: Token di autenticazione mancante o non valido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflitto - Username già esistente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               username_taken:
 *                 summary: Username non disponibile
 *                 value:
 *                   error: "Username non disponibile"
 *                   message: "L'username scelto è già utilizzato da un altro utente"
 */

router.post('/change_password', jwtAuth, changePassword);
/**
 * @swagger
 * /api/auth/change_password:
 *   post:
 *     summary: Cambia password utente
 *     description: |
 *       Permette all'utente autenticato di modificare la propria password.
 *       
 *       **Requisiti di sicurezza:**
 *       - Deve fornire la password attuale corretta
 *       - La nuova password deve rispettare i criteri di sicurezza
 *       - Dopo il cambio, tutte le sessioni attive vengono invalidate (tranne quella corrente)
 *       
 *       **Criteri password:**
 *       - Minimo 8 caratteri
 *       - Almeno una lettera maiuscola
 *       - Almeno una lettera minuscola  
 *       - Almeno un numero
 *       - Almeno un carattere speciale
 *       - Non deve essere uguale alla password precedente
 *       
 *       **Sicurezza:**
 *       - La password viene hashata con bcrypt
 *       - Viene registrato l'evento nei log di sicurezza
 *       - Viene aggiornata la data di cambio password
 *     tags: [Autenticazione]
 *     operationId: changePassword
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: Password attuale e nuova password
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Password attuale dell'utente
 *                 example: "OldSecurePass123!"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
 *                 description: |
 *                   Nuova password che deve contenere:
 *                   - Almeno 8 caratteri
 *                   - Una lettera maiuscola
 *                   - Una lettera minuscola
 *                   - Un numero
 *                   - Un carattere speciale (@$!%*?&)
 *                 example: "NewSecurePass456!"
 *               confirmPassword:
 *                 type: string
 *                 description: Conferma della nuova password (opzionale, per sicurezza lato client)
 *                 example: "NewSecurePass456!"
 *           examples:
 *             password_change:
 *               summary: Cambio password standard
 *               value:
 *                 oldPassword: "OldSecurePass123!"
 *                 newPassword: "NewSecurePass456!"
 *                 confirmPassword: "NewSecurePass456!"
 *     responses:
 *       200:
 *         description: Password cambiata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password cambiata con successo"
 *                 passwordChangedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Data e ora del cambio password
 *                   example: "2023-12-01T16:45:00Z"
 *                 warning:
 *                   type: string
 *                   description: Avviso importante per l'utente
 *                   example: "Tutte le altre sessioni sono state invalidate per sicurezza"
 *             examples:
 *               success:
 *                 summary: Cambio riuscito
 *                 value:
 *                   message: "Password cambiata con successo"
 *                   passwordChangedAt: "2023-12-01T16:45:00Z"
 *                   warning: "Tutte le altre sessioni sono state invalidate per sicurezza"
 *       400:
 *         description: Errore nella validazione della password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               weak_password:
 *                 summary: Password troppo debole
 *                 value:
 *                   error: "Password non valida"
 *                   message: "La nuova password non rispetta i criteri di sicurezza"
 *                   errors:
 *                     newPassword: [
 *                       "Deve contenere almeno una lettera maiuscola",
 *                       "Deve contenere almeno un carattere speciale"
 *                     ]
 *               same_password:
 *                 summary: Password uguale alla precedente
 *                 value:
 *                   error: "Password non accettabile"
 *                   message: "La nuova password deve essere diversa da quella attuale"
 *       401:
 *         description: Password attuale non corretta o token non valido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               wrong_current_password:
 *                 summary: Password attuale errata
 *                 value:
 *                   error: "Password attuale non corretta"
 *                   message: "La password attuale fornita non è corretta"
 *               invalid_token:
 *                 summary: Token non valido
 *                 value:
 *                   error: "Token non valido"
 *                   message: "Token di autenticazione scaduto o non valido"
 *       429:
 *         description: Troppi tentativi di cambio password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               rate_limit:
 *                 summary: Rate limit superato
 *                 value:
 *                   error: "Troppi tentativi"
 *                   message: "Puoi cambiare la password massimo 3 volte ogni 24 ore"
 */


/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Lista tutti gli utenti (Admin)
 *     description: |
 *       Recupera l'elenco completo di tutti gli utenti registrati nel sistema.
 *       
 *       **RICHIEDE PRIVILEGI DI AMMINISTRATORE**
 *       
 *       **Funzionalità:**
 *       - Visualizza tutti gli utenti del sistema
 *       - Include informazioni sensibili (email, ruoli, stato account)
 *       - Supporta filtri e paginazione tramite query parameters
 *       - Esclude automaticamente le password per sicurezza
 *       
 *       **Filtri disponibili:**
 *       - `role`: Filtra per ruolo utente
 *       - `isActive`: Filtra per stato account (attivo/inattivo)
 *       - `search`: Ricerca per username, email o nome
 *       
 *       **Use Cases:**
 *       - Dashboard amministrativa
 *       - Gestione utenti
 *       - Audit e monitoring
 *       - Statistiche sistema
 *     tags: [Autenticazione]
 *     operationId: getAllUsers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Numero di pagina (inizia da 1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - name: limit
 *         in: query
 *         description: Numero di utenti per pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 20
 *       - name: role
 *         in: query
 *         description: Filtra per ruolo utente
 *         schema:
 *           type: string
 *           enum: [cittadino, operatore_comunale, amministratore]
 *           example: "operatore_comunale"
 *       - name: isActive
 *         in: query
 *         description: Filtra per stato account
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: search
 *         in: query
 *         description: Ricerca per username, email o nome
 *         schema:
 *           type: string
 *           example: "mario"
 *     responses:
 *       200:
 *         description: Lista utenti recuperata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                       example: 1
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     count:
 *                       type: integer
 *                       example: 150
 *             examples:
 *               success:
 *                 summary: Lista utenti
 *                 value:
 *                   users:
 *                     - _id: "507f1f77bcf86cd799439011"
 *                       username: "mario_rossi"
 *                       email: "mario.rossi@email.com"
 *                       fullName:
 *                         name: "Mario"
 *                         surname: "Rossi"
 *                       role: "cittadino"
 *                       isActive: true
 *                       createdAt: "2023-10-01T12:00:00Z"
 *                     - _id: "507f1f77bcf86cd799439012"
 *                       username: "g_verdi_op"
 *                       email: "g.verdi@comune.roma.it"
 *                       fullName:
 *                         name: "Giuseppe"
 *                         surname: "Verdi"
 *                       role: "operatore_comunale"
 *                       isActive: true
 *                       createdAt: "2023-10-15T09:30:00Z"
 *                   pagination:
 *                     current: 1
 *                     total: 5
 *                     count: 150
 *       401:
 *         description: Token di autenticazione mancante o non valido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Privilegi insufficienti - Solo amministratori
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               insufficient_privileges:
 *                 summary: Accesso negato
 *                 value:
 *                   error: "Accesso negato"
 *                   message: "Solo gli amministratori possono visualizzare tutti gli utenti"
 * 
 *   post:
 *     summary: Crea nuovo utente (Admin)
 *     description: |
 *       Crea un nuovo account utente con privilegi amministrativi.
 *       
 *       **RICHIEDE PRIVILEGI DI AMMINISTRATORE**
 *       
 *       **Differenze dalla registrazione pubblica:**
 *       - L'amministratore può assegnare qualsiasi ruolo
 *       - Può creare account direttamente attivi
 *       - Può impostare password temporanee
 *       - Bypass di alcune validazioni standard
 *       
 *       **Use Cases:**
 *       - Creazione account operatori comunali
 *       - Setup account amministratori
 *       - Migrazione utenti da altri sistemi
 *       - Account di servizio/test
 *     tags: [Autenticazione]
 *     operationId: createUserByAdmin
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: Dati del nuovo utente da creare
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - username
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "operatore1@comune.roma.it"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "TempPass123!"
 *               fullName:
 *                 type: object
 *                 required:
 *                   - name
 *                   - surname
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Luigi"
 *                   surname:
 *                     type: string
 *                     example: "Bianchi"
 *               username:
 *                 type: string
 *                 example: "luigi_bianchi_op"
 *               role:
 *                 type: string
 *                 enum: [cittadino, operatore_comunale, amministratore]
 *                 example: "operatore_comunale"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               zone:
 *                 type: string
 *                 description: Zona di competenza (per operatori)
 *                 example: "Centro Storico"
 *           examples:
 *             create_operator:
 *               summary: Crea operatore comunale
 *               value:
 *                 email: "operatore1@comune.roma.it"
 *                 password: "TempPass123!"
 *                 fullName:
 *                   name: "Luigi"
 *                   surname: "Bianchi"
 *                 username: "luigi_bianchi_op"
 *                 role: "operatore_comunale"
 *                 zone: "Centro Storico"
 *             create_admin:
 *               summary: Crea amministratore
 *               value:
 *                 email: "admin2@minustrash.com"
 *                 password: "SuperSecure456!"
 *                 fullName:
 *                   name: "Anna"
 *                   surname: "Verdi"
 *                 username: "anna_verdi_admin"
 *                 role: "amministratore"
 *     responses:
 *       201:
 *         description: Utente creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utente creato con successo"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               success:
 *                 summary: Utente creato
 *                 value:
 *                   message: "Utente creato con successo"
 *                   user:
 *                     _id: "507f1f77bcf86cd799439013"
 *                     username: "luigi_bianchi_op"
 *                     email: "operatore1@comune.roma.it"
 *                     fullName:
 *                       name: "Luigi"
 *                       surname: "Bianchi"
 *                     role: "operatore_comunale"
 *                     isActive: true
 *                     createdAt: "2023-12-01T17:00:00Z"
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token di autenticazione mancante o non valido
 *       403:
 *         description: Privilegi insufficienti - Solo amministratori
 *       409:
 *         description: Email o username già esistenti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Route per il refresh token
router.post('/refresh-token', refreshTokenHandler);

// Add logout handler to the router
router.post('/logout', jwtAuth, logout);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
/**
 * @swagger
 * /api/auth/users/{userId}:
 *   put:
 *     summary: Aggiorna un utente tramite ID (Solo amministratore)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID dell'utente da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Utente aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dati non validi
 *       401:
 *         description: Non autorizzato - Token mancante o non valido
 *       403:
 *         description: Vietato - L'utente non ha privilegi di amministratore
 *       404:
 *         description: Utente non trovato
 * 
 *   delete:
 *     summary: Elimina un utente tramite ID (Solo amministratore)
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID dell'utente da eliminare
 *     responses:
 *       200:
 *         description: Utente eliminato con successo
 *       401:
 *         description: Non autorizzato - Token mancante o non valido
 *       403:
 *         description: Vietato - L'utente non ha privilegi di amministratore
 *       404:
 *         description: Utente non trovato
 */

// Admin routes for user management
router.get('/users', jwtAuth, getAllUsers);
router.post('/users', jwtAuth, register);
router.put('/users/:userId', jwtAuth, updateUserById);
router.delete('/users/:userId', jwtAuth, deleteUserById);

export default router;