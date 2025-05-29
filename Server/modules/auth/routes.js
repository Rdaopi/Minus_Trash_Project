import express from 'express';
import { basicAuth } from "./middlewares/basicAuth.js";
import { 
  login, 
  register, 
  changePassword, 
  profile_update, 
  //user_delete, 
  //updateUserRole,
  getAllUsers,
  deleteUserById,
  updateUserById
} from './controllers/userController.js';
import { auditOnSuccess } from "./middlewares/withAudit.js";
import { googleAuth, googleAuthCallback } from "./middlewares/googleAuth.js";
import { jwtAuth } from "./middlewares/jwtAuth.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router()


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *         - surname
 *         - username
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         fullName:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             surname:
 *               type: string
 *         role:
 *           type: string
 *           enum:
 *             - cittadino
 *             - operatore_comunale
 *             - amministratore
 *       example:
 *         email: "test@test.com"
 *         password: "Securepass123!"
 *         fullName:
 *           name: "Test"
 *           surname: "Test"
 *         username: "test"
 *         role: "cittadino"
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestione autenticazione e registrazione
 */

//Registrazione classica
router.post('/register', auditOnSuccess('user_registration', ['email']), register);

//request url: http://localhost:5000/api/auth/register
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuovo utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Utente registrato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utente già registrato"
 *                 errors:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "Email già registrata"
 *                     username:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "Username già registrato"
 */


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login utente (richiede Basic Auth)
 *     tags: [Auth]
 *     security:
 *       - BasicAuth: []
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenziali non valide
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
 *     summary: Login utente (test senza Basic Auth)
 *     tags: [Auth]
 *     requestBody:
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenziali non valide
 */

//Registrazione/Login via google
router.get('/googleOAuth/login', googleAuth);
/**
 * @swagger
 * /api/auth/googleOAuth/login:
 *   get:
 *     summary: Inizia flusso di login con Google
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect all'autenticazione Google
 */

// Callback Google (GET)
router.get('/googleOAuth/callback', googleAuthCallback);
/**
 * @swagger
 * /api/auth/googleOAuth/callback:
 *   get:
 *     summary: Callback dopo autenticazione Google
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Autenticazione completata
 *       401:
 *         description: Autenticazione fallita
 */

//Route Protette da JWT
//Da implementare con il JWT, attualmente richiede autenticazione base
router.post('/profile_update', basicAuth, login /*jwtAuth*/, profile_update);
/**
 * @swagger
 * /api/auth/profile_update:
 *   post:
 *     summary: Aggiorna il profilo utente
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   surname:
 *                     type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profilo aggiornato con successo
 */

router.post('/change_password', basicAuth, login /*jwtAuth*/, changePassword);
/**
 * @swagger
 * /api/auth/change_password:
 *   post:
 *     summary: Cambia password utente
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
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
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password cambiata con successo
 *       400:
 *         description: Errore nel cambio password
 */


// Admin routes for user management
router.get('/users', jwtAuth, getAllUsers);
router.post('/users', jwtAuth, register);
router.put('/users/:userId', jwtAuth, updateUserById);
router.delete('/users/:userId', jwtAuth, deleteUserById);

export default router;