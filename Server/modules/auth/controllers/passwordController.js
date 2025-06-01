import User from '../models/User.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import auditService from '../../audit/services/audit.service.js';

// Request password reset
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Non esiste un account con questa email'
            });
        }

        // Generate reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        try {
            await sendPasswordResetEmail(user.email, resetToken, user.username);

            res.status(200).json({
                status: 'success',
                message: 'Token inviato via email'
            });
        } catch (error) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                status: 'error',
                message: 'Errore nell\'invio dell\'email. Riprova più tardi.'
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Si è verificato un errore durante il processo di reset password'
        });
    }
};

// Reset password with token
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user by token and check if token is expired
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Token non valido o scaduto'
            });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.passwordChangedAt = Date.now();

        await user.save();

        // Log the password reset event
        await auditService.logEvent({
            action: 'password_change',
            user: user._id,
            method: 'email',
            ip: req.ip || 'unknown',
            device: req.headers['user-agent'] || 'unknown',
            email: user.email,
            metadata: {
                resetViaEmail: true,
                timestamp: new Date()
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'Password aggiornata con successo'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Si è verificato un errore durante il reset della password'
        });
    }
}; 