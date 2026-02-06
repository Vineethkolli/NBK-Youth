import { google } from 'googleapis';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';

dotenv.config({ quiet: true });

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toHtmlText = (value) => escapeHtml(value).replace(/\n/g, '<br />');

const buildEmailHtml = ({ subject, body, footer }) => {
  const safeSubject = escapeHtml(subject);
  const safeBody = toHtmlText(body);
  const safeFooter = toHtmlText(footer);

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">

  <title>${safeSubject}</title>

  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
    }

    @media (prefers-color-scheme: dark) {
      body { background-color: #0d1117 !important; }
      .email-bg { background-color: #0d1117 !important; }
      .email-container { background-color: #161b22 !important; color: #e6edf3 !important; border: 1px solid #30363d !important; }
      .header-td { background-color: #0d1117 !important; border-bottom: 1px solid #30363d !important; }
      .footer-td { background-color: #0d1117 !important; color: #8b949e !important; border-top: 1px solid #30363d !important; }
      h1, p, span { color: #e6edf3 !important; }
      .text-gray { color: #9ca3af !important; }
    }
  </style>
</head>

<body style="margin:0; padding:0; background-color:#f9fafb;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:#f9fafb;">
    <tr>
      <td align="center">

        <table role="presentation" align="center" width="600" class="email-container"
               style="margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

          <!-- HEADER -->
          <tr>
            <td class="header-td" align="center" style="background-color:#1a202c; padding:20px;">
              <h1 style="margin:0; color:#ffffff; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:20px; font-weight:700;">
                ${safeSubject}
              </h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:22px; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#374151; font-size:15px; line-height:1.7;">
              ${safeBody}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="background-color:#edf2f7; padding:18px; border-top:1px solid #e5e7eb;">
              <p class="text-gray" style="margin-top:12px; font-size:12px; color:#718096;">
                © 2024 Developed by <b>Kolli Vineeth</b><br/>
                Stay connected. Stay active...
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
};

const buildRawMessage = ({ from, to, subject, html }) => {
  const encodedSubject = Buffer.from(subject, 'utf8').toString('base64');
  const messageParts = [
    `From: "NBK Youth Gangavaram" <${from}>`,
    `To: ${to}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    `Subject: =?utf-8?B?${encodedSubject}?=`,
    '',
    html
  ];

  const message = messageParts.join('\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const sendSingleEmail = async ({ to, subject, body, footer }) => {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const from = process.env.GMAIL_USER;
  const html = buildEmailHtml({ subject, body, footer });

  const raw = buildRawMessage({ from, to, subject, html });

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const sendEmailsSequential = async ({ recipients, subject, body, footer }) => {
  const successRecipients = [];
  const failedRecipients = [];

  for (let i = 0; i < recipients.length; i += 1) {
    const recipient = recipients[i];
    if (!recipient?.email) {
      failedRecipients.push(recipient);
      continue;
    }

    try {
      await sendSingleEmail({
        to: recipient.email,
        subject,
        body,
        footer
      });
      successRecipients.push(recipient);
    } catch (error) {
      console.error('Email send failed:', error?.message || error);
      failedRecipients.push(recipient);
    }

    if (i < recipients.length - 1) {
      await sleep(5000);
    }
  }

  return { successRecipients, failedRecipients };
};
