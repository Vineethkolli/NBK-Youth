import { google } from 'googleapis';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';

dotenv.config({ quiet: true }); 

const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
);

oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

export const sendOTPEmail = async (email, otp) => {
    try {
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        const from = process.env.GMAIL_USER;
        const to = email;
        const subject = 'Password Reset OTP';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #23984eff;">NBK YOUTH WEB APP</h1>
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    This is an automated email, please do not reply.
                </p>
            </div>
        `;

        const messageParts = [
            `From: "NBK Youth" <${from}>`,
            `To: ${to}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${subject}`,
            '',
            html,
        ];
        
        const message = messageParts.join('\n');

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        console.log('Email sent');
        return true;
    } catch (error) {
        console.error('Email sending failed:', error.message);
        return false;
    }
};
