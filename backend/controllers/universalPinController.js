import bcrypt from 'bcrypt';
import UniversalPin from '../models/UniversalPin.js';
import OTP from '../models/OTP.js';
import { sendOTPEmail } from '../services/emailOTPService.js';
import { logActivity } from '../middleware/activityLogger.js';

const DEFAULT_DEVELOPER_EMAIL = 'gangavaramnbkyouth@gmail.com';

const createOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const validPin = (pin) =>
  /^\d{6}$/.test(String(pin || ''));

const otpEmail = () =>
  `pin:${DEFAULT_DEVELOPER_EMAIL}`;

export const universalPinController = {
  status: async (req, res) => {
    res.json({
      configured: Boolean(
        await UniversalPin.exists({ key: 'default' })
      ),
    });
  },

  verify: async (req, res) => {
    const setting = await UniversalPin.findOne({
      key: 'default',
    });

    if (
      !setting ||
      !(await bcrypt.compare(
        String(req.body.pin || ''),
        setting.pinHash
      ))
    ) {
      return res.status(401).json({
        message: 'Invalid universal PIN',
      });
    }

    await logActivity(req, 'VERIFY', 'UniversalPin', 'default', { before: null, after: null }, 'Universal PIN verified');
    res.json({ valid: true });
  },

  requestOtp: async (req, res) => {
    const email = otpEmail();
    const otp = createOtp();

    await OTP.findOneAndUpdate(
      { email },
      {
        otp,
        createdAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    if (
      !await sendOTPEmail(
        DEFAULT_DEVELOPER_EMAIL,
        otp,
        'reset_password'
      )
    ) {
      return res.status(500).json({
        message: 'Failed to send PIN OTP',
      });
    }

    await logActivity(req, 'VERIFY', 'UniversalPin', 'default', { before: null, after: null }, 'Universal PIN reset OTP sent');

    res.json({
      message: 'PIN OTP sent to the default developer email',
    });
  },

  verifyOtp: async (req, res) => {
    const email = otpEmail();

    const record = req.body.otp
      ? await OTP.findOne({
          email,
          otp: String(req.body.otp),
        })
      : null;

    if (
      !record ||
      Date.now() - record.createdAt.getTime() >
        10 * 60 * 1000
    ) {
      return res.status(400).json({
        message: 'Invalid or expired OTP',
      });
    }

    await logActivity(req, 'VERIFY', 'UniversalPin', 'default', { before: null, after: null }, 'Universal PIN reset OTP validated');
    res.json({ valid: true });
  },

  change: async (req, res) => {
    const { otp, pin, confirmPin } = req.body || {};

    if (!validPin(pin) || pin !== confirmPin) {
      return res.status(400).json({
        message: 'PINs must match and contain exactly 6 digits',
      });
    }

    const email = otpEmail();

    const record = otp
      ? await OTP.findOne({
          email,
          otp: String(otp),
        })
      : null;

    if (
      !record ||
      Date.now() - record.createdAt.getTime() >
        10 * 60 * 1000
    ) {
      return res.status(400).json({
        message: 'Invalid or expired OTP',
      });
    }

    await OTP.deleteOne({ _id: record._id });

    await UniversalPin.findOneAndUpdate(
      { key: 'default' },
      {
        pinHash: await bcrypt.hash(String(pin), 10),
        updatedBy: req.user.registerId,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    await logActivity(req, 'UPDATE', 'UniversalPin', 'default', { before: null, after: { configured: true } }, 'Universal PIN updated');

    res.json({
      message: 'Universal PIN saved',
    });
  },
};
