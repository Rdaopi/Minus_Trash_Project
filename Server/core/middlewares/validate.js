// validate.js
import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').isStrongPassword()
];