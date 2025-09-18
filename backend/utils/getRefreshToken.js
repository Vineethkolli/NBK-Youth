//commad: node utils/getRefreshToken.js

import express from 'express';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const app = express();

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5000/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate auth URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('Visit this URL in your browser to authorize:\n', authUrl);

// OAuth2 callback route
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.send('No code received');

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('REFRESH TOKEN:', tokens.refresh_token);
    res.send(
      'Refresh token printed in server console. Copy it into your .env as GMAIL_REFRESH_TOKEN'
    );
  } catch (err) {
    console.error('Error retrieving tokens:', err.response?.data || err.message);
    res.send('Error retrieving tokens. Check server console.');
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
