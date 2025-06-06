import jwt from 'jsonwebtoken';
import Token from '../models/Token.js';

class AuthService {
    // Method to generate both access and refresh tokens
    static async generateTokens(user, ip, userAgent) {
        const accessToken = jwt.sign(
            { 
                id: user._id,
                role: user.role 
            },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '1m' }
            //1m for testing
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // Save refresh token in database
        await Token.create({
            user: user._id,
            refreshToken, // Will be automatically hashed by the pre-save middleware
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            ipAddress: ip,
            userAgent
        });

        return { accessToken, refreshToken };
    }

    // Method to revoke all user tokens
    static async revokeAllUserTokens(userId) {
        return await Token.revokeAllUserTokens(userId);
    }

    // Method to verify refresh token
    static async verifyRefreshToken(token) {
        const tokenDoc = await Token.findOne({ refreshToken: token });
        if (!tokenDoc || !tokenDoc.isValid()) {
            return null;
        }
        return tokenDoc;
    }
}

export default AuthService; 