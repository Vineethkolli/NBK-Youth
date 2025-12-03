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
    const logoUrl = `https://res.cloudinary.com/dlsmkjgjb/image/upload/v1763906348/192_zpahrw.png`;

    const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Welcome to NBK Youth</title>

  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->

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
      .img-max {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
      }
    }

    @media (prefers-color-scheme: dark) {
      body { background-color: #0d1117 !important; }
      .email-bg { background-color: #0d1117 !important; }
      .email-container { background-color: #161b22 !important; color: #e6edf3 !important; border: 1px solid #30363d !important; }
      .header-td { background-color: #0d1117 !important; border-bottom: 1px solid #30363d; }
      .footer-td { background-color: #0d1117 !important; color: #8b949e !important; border-top: 1px solid #30363d; }
      .button-bg { background-color: #e3b341 !important; }
      .button-text { color: #0d1117 !important; }
      h1, p, span { color: #e6edf3 !important; }
      .dark-text-gray { color: #8b949e !important; }
    }
  </style>
</head>

<body style="margin:0; padding:0; word-spacing:normal; background-color:#f9fafb;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="email-bg" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:0;">

        <!--[if mso]>
        <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" width="600">
        <tr><td>
        <![endif]-->

        <table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" class="email-container"
               style="margin:0 auto; max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

          <tr>
            <td align="center" class="header-td"
                style="background-color:#1a202c; padding:20px 20px; border-top-left-radius:12px; border-top-right-radius:12px;">
              <img src="${logoUrl}" width="80" height="80" style="display:block;border-radius:50%; margin-bottom:14px;">
              <h1 style="margin:0; color:#ffffff; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:22px; font-weight:700;">
                Welcome, ${name}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 20px; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <p style="color:#2d3748; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
                We're delighted to welcome you to <b>NBK Youth Gangavaram</b> - a community that celebrates togetherness, culture, and pride of Gangavaram.
              </p>

              <p style="color:#4a5568; font-size:16px; line-height:1.6; margin:0 0 20px 0;">
                Wherever you are in the <span style="white-space: nowrap;">world&nbsp;🌍</span>, stay connected with your village, your people, and your memories — all in one place.
              </p>

              <p style="color:#4a5568; font-size:16px; line-height:1.6; margin:0 0 30px 0;">
                Explore the latest <b>events</b>, <b>moments</b>, and <b>updates</b> from our vibrant community, and relive the joy of Gangavaram anytime.
              </p>

              <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:auto;">
                <tr>
                  <td class="button-bg" style="border-radius:8px; background-color:#d4a017; text-align:center;">
                    <a href="${baseUrl}" class="button-text" target="_blank"
                       style="background-color:#d4a017; border:1px solid #d4a017; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:16px; font-weight:bold; color:#ffffff; padding:14px 20px; text-decoration:none; display:inline-block; border-radius:8px;">
                       🚀&nbsp;&nbsp;Visit NBK Youth
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#4a5568; font-size:16px; line-height:1.6; margin:30px 0 0 0; text-align:center;">
                Together, we preserve memories and celebrate our <span style="white-space: nowrap;">culture&nbsp;❤️</span>
              </p>

              <div style="padding-top:20px;">
                <p style="color:#2d3748; font-weight:600; margin:0; font-size:16px;">Warm regards,</p>
                <p style="color:#718096; margin:5px 0 0 0; font-size:15px;">NBK Youth Gangavaram</p>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" class="footer-td" style="background-color:#edf2f7; padding:12px;">
              <p class="dark-text-gray" style="margin:0; color:#718096; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6;">
                © 2024 Developed by <b>Kolli Vineeth</b><br>Stay connected. Stay active...
              </p>
            </td>
          </tr>

        </table>

        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->

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

    console.log(`Signup Email sent`);
    return true;
  } catch (error) {
    console.error('Signup email sending failed:', error.message);
    return false;
  }
};
