import express from 'express';
import { basicAuth } from ".middlewares/basicAuth.js";
import { login, register, changePassword, profile_update, user_delete } from './controllers/userController.js';
//import { googleAuth } from "./middlewares/googleAuth.js";
//import { jwtAuth } from "./middlewares/jwtAuth.js";

const router = express.Router()

//Registrazione classica
router.post('/register', register);

//Login classico
router.post('/login', basicAuth, 
    // Da fare: Rimpiazzare la stub con il login dello user una volta implementato in userController.js
    (req, res) => res.status(501).json({ error: 'login non implementato' })
);

//Registrazione/Login via google
router.get('/googleOAuth/login',
    // Da fare: Rimpiazzare la stub con googleAuth middleware una volta implementato
    (req, res, next) => res.status(501).json({ error: 'googleAuth middleware non implementato' }),
    // Da fare: Rimpiazzare la stub con il login dello user una volta implementato
    (req, res) => res.status(501).json({ error: 'login non implementato' })
);

// Callback Google (GET)
router.get('/googleOAuth/callback',
    // Da fare: Rimpiazzare la stub con googleAuth middleware una volta implementato
    (req, res, next) => res.status(501).json({ error: 'googleAuth middleware non implementato' }),
    // Da fare: Rimpiazzare la stub con il login dello user una volta implementato
    (req, res) => res.status(501).json({ error: 'login non implementato' })
  );

//Route Protette da JWT
//Da implementare con il JWT, attualmente richiede autenticazione base
router.post('/profile_update', basicAuth, login /*jwtAuth*/, profile_update);
router.post('/change_password', basicAuth, login /*jwtAuth*/, changePassword);
router.delete('/user_delete', basicAuth, login /*jwtAuth*/, user_delete);

export default router;