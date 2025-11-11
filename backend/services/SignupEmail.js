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

export const sendSignupEmail = async (email, name) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const from = process.env.GMAIL_USER;
    const to = email;
    const subject = 'Welcome to NBK Youth 🎉';

    const baseUrl = process.env.FRONTEND_URL;
    const logoUrl = `${baseUrl}/logo/192.png`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <style>
          body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f9fafb;
            font-family: 'Segoe UI', Roboto, sans-serif;
          }
          table {
            border-spacing: 0;
            border-collapse: collapse;
          }
          img {
            border: 0;
            display: block;
          }
          a {
            text-decoration: none;
          }
          @media (prefers-color-scheme: dark) {
            body { background-color: #0d1117 !important; }
            .email-container { background-color: #161b22 !important; color: #e6edf3 !important; }
            .footer { background-color: #0d1117 !important; color: #8b949e !important; }
            .btn { background-color: #e3b341 !important; color: #0d1117 !important; }
            h1, p { color: #e6edf3 !important; }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#f9fafb;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
          <tr>
            <td align="center" style="padding:0;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-container"
                     style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05);overflow:hidden;margin:0 auto;">
                <!-- HEADER -->
                <tr>
                  <td align="center" style="background-color:#1a202c;padding:20px 24px;">
                    <img src="${logoUrl}" alt="NBK Youth" width="72" height="72"
                         style="display:block;border-radius:50%;margin-bottom:16px;">
                    <h1 style="color:#f7fafc;margin:0;font-size:22px;font-weight:600;">Welcome, ${name}</h1>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td style="padding:30px 24px;">
                    <p style="color:#2d3748;font-size:16px;line-height:1.7;margin-top:0;">
                      We're delighted to welcome you to <b>NBK Youth</b> — a community that celebrates togetherness, culture, and pride of Gangavaram.
                    </p>

                    <!-- FIX 1: Added span with white-space: nowrap -->
                    <p style="color:#4a5568;font-size:15px;line-height:1.7;">
                      Wherever you are in the <span style="white-space: nowrap;">world&nbsp;🌍</span>, stay connected with your village, your people, and your memories — all in one place.
                    </p>

                    <p style="color:#4a5568;font-size:15px;line-height:1.7;">
                      Explore the latest <b>events</b>, <b>moments</b>, and <b>updates</b> from our vibrant community, and relive the joy of Gangavaram anytime.
                    </p>

                    <div style="text-align:center;margin:40px 0;">
                      <a href="${baseUrl}"
                         class="btn"
                         style="background-color:#d4a017;color:#fff;padding:14px 32px;border-radius:8px;
                         font-weight:bold;font-size:16px;display:inline-block;text-decoration:none;">
                        Visit NBK Youth
                      </a>
                    </div>

                    <!-- FIX 2: Added span with white-space: nowrap -->
                    <p style="color:#4a5568;font-size:15px;line-height:1.7;text-align:center;">
                      Together, we preserve memories and celebrate our <span style="white-space: nowrap;">culture&nbsp;❤️</span>
                    </p>

                    <p style="margin-top:28px;color:#2d3748;font-weight:500;">Warm regards,</p>
                    <p style="color:#4a5568;margin:0;">NBK Youth Gangavaram</p>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td align="center" class="footer" style="background-color:#edf2f7;padding:20px;">
                    <p style="margin:0;color:#718096;font-size:13px;line-height:1.6;">
                      © 2024 Developed by <b>Kolli Vineeth</b><br>
                      Stay active. Stay connected...
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const messageParts = [
      `From: "NBK Youth" <${from}>`,
      `To: ${to}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
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

    console.log(`Signup email sent successfully`);
    return true;
  } catch (error) {
    console.error('Signup email sending failed:', error.message);
    return false;
  }
};
