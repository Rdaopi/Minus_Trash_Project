import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auditService from '../../audit/services/audit.service.js';

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/googleOAuth/callback`,
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });
        let isNewUser = false;
        
        if (!user) {
            // Create new user if doesn't exist
            isNewUser = true;
            user = await User.create({
                email: profile.emails[0].value,
                username: profile.emails[0].value.split('@')[0], // Use email prefix as username
                fullName: {
                    name: profile.name.givenName || profile.displayName.split(' ')[0],
                    surname: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ')
                },
                password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
                authMethods: {
                    google: {
                        id: profile.id,
                        email: profile.emails[0].value,
                        enabled: true
                    }
                }
            });
        } else if (!user.authMethods?.google?.id) {
            // If user exists but doesn't have Google auth method, update it
            user.authMethods = {
                ...user.authMethods,
                google: {
                    id: profile.id,
                    email: profile.emails[0].value,
                    enabled: true
                }
            };
            await user.save();
        }

        return done(null, { user, isNewUser });
    } catch (error) {
        return done(error, null);
    }
}));

export const googleAuth = passport.authenticate('google', { session: false });

export const googleAuthCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, data) => {
        if (err) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth?error=Authentication failed`);
        }
        if (!data || !data.user) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth?error=User not found`);
        }

        const { user, isNewUser } = data;

        try {
            // Generate JWT token with user role
            const token = jwt.sign(
                { 
                    id: user._id,
                    email: user.email,
                    role: user.role // Include the role in the token
                },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: '24h' }
            );

            // Update lastLogin
            user.lastLogin = Date.now();
            await user.save();

            // Log the appropriate event
            if (isNewUser) {
                await auditService.logEvent({
                    action: 'user_registration',
                    user: user._id,
                    method: 'google',
                    status: 'success',
                    ip: req.ip,
                    device: req.headers['user-agent'],
                    metadata: {
                        email: user.email,
                        role: user.role
                    }
                });
            } else {
                await auditService.logEvent({
                    action: 'login',
                    user: user._id,
                    method: 'google',
                    status: 'success',
                    ip: req.ip,
                    device: req.headers['user-agent'],
                    metadata: {
                        email: user.email,
                        role: user.role
                    }
                });
            }

            // Redirect to frontend auth page with token and role
            res.redirect(`${process.env.FRONTEND_URL}/auth?token=${token}&role=${user.role}`);
        } catch (error) {
            console.error('Auth error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/auth?error=Authentication failed`);
        }
    })(req, res, next);
}; 