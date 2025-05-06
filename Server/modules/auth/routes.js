import express from 'express';
import { basicAuth } from '../../core/middlewares/auth.js'; //FIX: Correzione path
import { register} from './controller/userController.js';

const router = express.Router()

router.post('/register', register);

router.post('/login', basicAuth, (req, res) => {
    res.json({ message: "Benvenuto " + req.user.username}); //FIX: correzione req.user.username al posto di res.user.username
})

export default router;