import express from 'express';
import { basicAuth } from "./middlewares/basicAuth.js";
import { login, register, changePassword, profile_update, user_delete } from './controllers/userController.js';
//import { googleAuth } from "./middlewares/googleAuth.js";
//import { jwtAuth } from "./middlewares/jwtAuth.js";

const router = express.Router()

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     security:
 *       - BasicAuth: []
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', basicAuth, login);

//Registrazione/Login via google
/**
 * @swagger
 * /auth/googleOAuth/login:
 *   get:
 *     tags: [Auth]
 *     summary: Google OAuth login
 *     description: Initiate Google OAuth authentication flow
 *     responses:
 *       302:
 *         description: Redirect to Google login
 */
router.get('/googleOAuth/login',
    // Da fare: Rimpiazzare la stub con googleAuth middleware una volta implementato
    (req, res, next) => res.status(501).json({ error: 'googleAuth middleware non implementato' }),
    // Da fare: Rimpiazzare la stub con il login dello user una volta implementato
    (req, res) => res.status(501).json({ error: 'login non implementato' })
);

/**
 * @swagger
 * /auth/googleOAuth/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Google OAuth callback
 *     description: Callback endpoint for Google OAuth process
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.get('/googleOAuth/callback',
    // Da fare: Rimpiazzare la stub con googleAuth middleware una volta implementato
    (req, res, next) => res.status(501).json({ error: 'googleAuth middleware non implementato' }),
    // Da fare: Rimpiazzare la stub con il login dello user una volta implementato
    (req, res) => res.status(501).json({ error: 'login non implementato' })
);

//Route Protette da JWT
//Da implementare con il JWT, attualmente richiede autenticazione base
/**
 * @swagger
 * /auth/profile_update:
 *   post:
 *     tags: [Auth]
 *     summary: Update user profile
 *     description: Update authenticated user's profile information
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/profile_update', basicAuth, login /*jwtAuth*/, profile_update);

/**
 * @swagger
 * /auth/change_password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 *     description: Change authenticated user's password
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Invalid current password
 */
router.post('/change_password', basicAuth, login /*jwtAuth*/, changePassword);

/**
 * @swagger
 * /auth/user_delete:
 *   delete:
 *     tags: [Auth]
 *     summary: Delete user account
 *     description: Delete authenticated user's account
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/user_delete', basicAuth, login /*jwtAuth*/, user_delete);

export default router;