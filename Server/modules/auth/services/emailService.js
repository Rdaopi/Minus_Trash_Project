import Mailjet from 'node-mailjet';

const mailjet = new Mailjet({
    apiKey: process.env.MAIL_API_KEY,
    apiSecret: process.env.MAIL_API_SECRET
});

export const sendPasswordResetEmail = async (email, resetToken, username) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log('Generated password reset URL:', resetUrl); // Debug log for backend

    try {
        const result = await mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [
                {
                    From: {
                        //Email: "noreply@minustrash.com",
                        Email: "alessio.wu@studenti.unitn.it",
                        Name: "Minus Trash"
                    },
                    To: [
                        {
                            Email: email,
                            Name: username
                        }
                    ],
                    Subject: "Reset Password - Minus Trash",
                    HTMLPart: `
                        <h1>Password Reset Request</h1>
                        <p>Ciao ${username},</p>
                        <p>Hai richiesto di reimpostare la tua password. Usa il link seguente per procedere:</p>
                        <p><a href="${resetUrl}">${resetUrl}</a></p>
                        <p>Se non funziona, usa http invece di https</p>
                        <p>Se non hai richiesto questo reset, ignora questa email.</p>
                        <p>Il link scadrà tra 1 ora.</p>
                        <p>Cordiali saluti,<br>Team Minus Trash</p>
                    `
                }
            ]
        });

        return result;
    } catch (error) {
        throw new Error('Errore nell\'invio dell\'email di reset password');
    }
}; 