import { google } from 'googleapis';
import { Buffer } from 'buffer';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

async function keepTokenAlive() {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const from = process.env.GMAIL_USER;
    const to = process.env.GMAIL_USER; 
    const subject = 'NBK Youth Keep-Alive';
    const html = `<p>This is an automatic keep-alive email to prevent token expiration.</p>`;

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

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    console.log('✅ Keep-alive email sent successfully.');
  } catch (err) {
    console.error('❌ Keep-alive failed:', err.message);
    process.exit(1); 
  }
}

// Run if called directly
if (require.main === module) keepTokenAlive();

export default keepTokenAlive;
