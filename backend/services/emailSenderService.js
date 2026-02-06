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
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1f2937; color: #ffffff; padding: 16px; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">NBK Youth</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 18px;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">${safeSubject}</h3>
        <div style="font-size: 14px; color: #374151; line-height: 1.6;">${safeBody}</div>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; background-color: #f9fafb; padding: 14px; border-radius: 0 0 10px 10px;">
        <div style="font-size: 12px; color: #6b7280; line-height: 1.6;">${safeFooter}</div>
      </div>
    </div>
  `;
};

const buildRawMessage = ({ from, to, subject, html }) => {
  const encodedSubject = Buffer.from(subject, 'utf8').toString('base64');
  const messageParts = [
    `From: "NBK Youth" <${from}>`,
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
