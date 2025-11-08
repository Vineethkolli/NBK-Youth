import { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import CustomPhoneInput from './PhoneInput';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../utils/firebase';

function ForgotPassword({ onBack, onOTPSent }) {
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Initialize Firebase Recaptcha
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      window.recaptchaVerifier.render();
    }
    return window.recaptchaVerifier;
  };

  // 🔹 EMAIL flow
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast.error('Enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: normalizedEmail });
      toast.success('OTP sent to your email');
      onOTPSent({ method: 'email', identifier: normalizedEmail });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 PHONE flow
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1️⃣ Check if user exists
      await axios.post(`${API_URL}/api/auth/check-phone`, { phone });
      toast.success('User found. Sending OTP...');

      // 2️⃣ Send OTP via Firebase
      const appVerifier = setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      window.confirmationResult = confirmationResult;

      toast.success('OTP sent to your phone');
      onOTPSent({ method: 'phone', identifier: phone });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600">Forgot Password</h2>
        <p className="text-sm text-gray-600 mt-1">
          {isPhoneMode
            ? 'Reset your password using your phone number'
            : 'Reset your password using your email address'}
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center gap-4 mb-2">
        <button
          type="button"
          onClick={() => setIsPhoneMode(false)}
          className={`px-3 py-1 rounded-md border ${
            !isPhoneMode ? 'bg-green-600 text-white' : 'border-green-600 text-green-600'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setIsPhoneMode(true)}
          className={`px-3 py-1 rounded-md border ${
            isPhoneMode ? 'bg-green-600 text-white' : 'border-green-600 text-green-600'
          }`}
        >
          Phone
        </button>
      </div>

      <form
        onSubmit={isPhoneMode ? handlePhoneSubmit : handleEmailSubmit}
        className="space-y-4"
      >
        {!isPhoneMode ? (
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
          />
        ) : (
          <CustomPhoneInput value={phone} onChange={setPhone} />
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Sending...' : 'Send OTP'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 text-green-600 hover:text-green-700"
        >
          Back to Sign In
        </button>
      </form>

      {/* Firebase Recaptcha */}
      <div id="recaptcha-container"></div>
    </div>
  );
}

export default ForgotPassword;
