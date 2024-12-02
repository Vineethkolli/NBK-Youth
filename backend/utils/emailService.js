import axios from 'axios';

const MAILTRAP_API_URL = 'https://send.api.mailtrap.io/api/send';

export const sendOTPEmail = async (email, otp) => {
  try {
    const payload = {
      from: {
        email: "noreply@nbkyouth.com",
        name: "NBK Youth"
      },
      to: [{
        email: email
      }],
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
      `,
      category: "Password Reset"
    };

    const response = await axios.post(MAILTRAP_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${process.env.MAILTRAP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    return response.status === 200;
  } catch (error) {
    console.error('Email sending failed:', error.response?.data || error.message);
    return false;
  }
};