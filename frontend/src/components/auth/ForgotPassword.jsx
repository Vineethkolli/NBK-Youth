import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { API_URL } from '../../utils/config';
import { getFirebaseAuth } from '../../utils/firebase';
import CustomPhoneInput from './PhoneInput';

const RECAPTCHA_CONTAINER_ID = 'forgot-password-recaptcha';

function ForgotPassword({
  onBack,
  onOTPSent,
  activeMethod = 'email',
  onMethodChange = () => {},
  initialIdentifier = '',
}) {
  const [email, setEmail] = useState(activeMethod === 'email' ? initialIdentifier : '');
  const [phoneNumber, setPhoneNumber] = useState(
    activeMethod === 'phone' ? initialIdentifier : ''
  );
  const [resetMethod, setResetMethod] = useState(activeMethod);
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    setResetMethod(activeMethod);
    if (activeMethod === 'email') {
      if (initialIdentifier) {
        setEmail(initialIdentifier);
      }
    } else if (activeMethod === 'phone' && initialIdentifier) {
      const parsed = parsePhoneNumberFromString(initialIdentifier);
      setPhoneNumber(parsed?.number || '');
    }
  }, [activeMethod, initialIdentifier]);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const toggleMethod = () => {
    const nextMethod = resetMethod === 'email' ? 'phone' : 'email';
    setResetMethod(nextMethod);
    onMethodChange(nextMethod);
    if (nextMethod === 'email' && recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
  };

  const validateEmail = (value) => {
    const normalizedEmail = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      toast.error('Please enter a valid email address');
      return null;
    }

    return normalizedEmail;
  };

  const validatePhone = (value) => {
    const parsed = parsePhoneNumberFromString(value || '');
    if (!parsed || !parsed.isValid()) {
      toast.error('Please enter a valid phone number');
      return null;
    }
    return parsed.number;
  };

  const prepareRecaptcha = (auth) => {
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
    }

    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        toast.error('reCAPTCHA expired, please try again');
      },
    });

    return recaptchaVerifierRef.current;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (resetMethod === 'email') {
      const normalizedEmail = validateEmail(email);
      if (!normalizedEmail) {
        setIsLoading(false);
        return;
      }

      try {
        await axios.post(`${API_URL}/api/auth/forgot-password`, { email: normalizedEmail });
        toast.success('OTP sent to your email');
        onOTPSent({ method: 'email', value: normalizedEmail });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to send OTP');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const normalizedPhone = validatePhone(phoneNumber);
    if (!normalizedPhone) {
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password/phone`, {
        phoneNumber: normalizedPhone,
      });

      const auth = getFirebaseAuth();
      const appVerifier = prepareRecaptcha(auth);
      const confirmationResult = await signInWithPhoneNumber(auth, normalizedPhone, appVerifier);

      toast.success('OTP sent to your phone');
      onOTPSent({
        method: 'phone',
        value: normalizedPhone,
        confirmationResult,
      });
      recaptchaVerifierRef.current = null;
    } catch (error) {
      if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/invalid-phone-number') {
        toast.error('Firebase rejected the phone number format');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to send OTP');
      }
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isPhone = resetMethod === 'phone';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600">Forgot Password</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter your {isPhone ? 'phone number' : 'email'} to receive an OTP
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          {isPhone ? (
            <CustomPhoneInput value={phoneNumber} onChange={setPhoneNumber} />
          ) : (
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Sending...' : 'Send OTP'}
        </button>

        
        <div className="text-center">
          <p className="text-black">
            Reset using{' '}
            <button
              type="button"
              onClick={toggleMethod}
              className="font-medium text-green-600 hover:text-green-500"
            >
              {isPhone ? 'Email' : 'Phone number'}
            </button>
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 px-4 text-green-600 hover:text-green-700"
        >
          Back to Sign In
        </button>
      </form>

      <div id={RECAPTCHA_CONTAINER_ID} className="hidden" aria-hidden="true" />
    </div>
  );
}

export default ForgotPassword;
