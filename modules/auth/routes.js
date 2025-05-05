import express from 'express';
import { basicAuth } from '../../core/middlewares/auth';
import {
    register,
} from './controller/userController.js';

const router = express.Router()

router.post('/register', register);

router.post('/login', basicAuth, (req, res) => {
    res.json({ message: "Benvenuto " + res.user.email});
})

export default router;