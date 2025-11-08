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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: normalizedEmail });
      toast.success('OTP sent to your email');
      onOTPSent({ method: 'email', value: normalizedEmail });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
    return window.recaptchaVerifier;
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phone) return toast.error('Enter valid phone number');
    setIsLoading(true);

    try {
      // 1️⃣ Verify phone in backend
      await axios.post(`${API_URL}/api/auth/check-phone`, { phone });

      // 2️⃣ Initialize Firebase OTP
      const appVerifier = setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      window.confirmationResult = confirmationResult;

      toast.success('OTP sent to your phone');
      onOTPSent({ method: 'phone', value: phone });
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
          {isPhoneMode ? 'Enter your phone number to get OTP' : 'Enter your email to get OTP'}
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-3">
        <button
          onClick={() => setIsPhoneMode(false)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            !isPhoneMode ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Reset using Email
        </button>
        <button
          onClick={() => setIsPhoneMode(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isPhoneMode ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Reset using Phone
        </button>
      </div>

      {!isPhoneMode ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 bg-green-600 text-white rounded-md ${
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
            Back
          </button>
        </form>
      ) : (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <CustomPhoneInput value={phone} onChange={setPhone} />
          <div id="recaptcha-container"></div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 bg-green-600 text-white rounded-md ${
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
            Back
          </button>
        </form>
      )}
    </div>
  );
}

export default ForgotPassword;
