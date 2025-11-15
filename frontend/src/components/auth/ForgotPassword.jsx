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
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resetMethod, setResetMethod] = useState(activeMethod);
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  // Remember last identifiers used for restoring after OTP
  const lastEmail = useRef('');
  const lastPhone = useRef('');

  // Restore identifier only when coming back from OTP
  useEffect(() => {
    setResetMethod(activeMethod);

    if (initialIdentifier) {
      if (activeMethod === 'email') {
        // Only restore email if it looks like one
        if (initialIdentifier.includes('@')) {
          setEmail(initialIdentifier);
          setPhoneNumber('');
        }
      } else if (activeMethod === 'phone') {
        // Only restore phone if it looks like a number
        const parsed = parsePhoneNumberFromString(initialIdentifier);
        if (parsed && parsed.isValid()) {
          setPhoneNumber(parsed.number);
          setEmail('');
        }
      }
    } else {
      // clean slate
      setEmail('');
      setPhoneNumber('');
    }
  }, [activeMethod, initialIdentifier]);

  // reCAPTCHA setup & cleanup
  useEffect(() => {
    const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
    if (window.grecaptcha && window.grecaptcha.get) {
      try {
        const widgetsCount = window.grecaptcha.get().length;
        for (let i = 0; i < widgetsCount; i++) window.grecaptcha.reset(i);
      } catch {}
    }
    if (container) container.innerHTML = '';

    if (resetMethod === 'phone') {
      const auth = getFirebaseAuth();
      setTimeout(() => {
        try {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
            size: 'invisible',
            callback: () => {},
            'expired-callback': () => toast.error('reCAPTCHA expired, please try again'),
          });

          recaptchaVerifierRef.current.render().catch((err) => {
            console.error('reCAPTCHA render error:', err);
            toast.error('Failed to render reCAPTCHA');
          });
        } catch (err) {
          console.error('Failed to initialize reCAPTCHA:', err);
        }
      }, 100);
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
      if (container) container.innerHTML = '';
    };
  }, [resetMethod]);

  // Toggle between email and phone
  const toggleMethod = () => {
    if (resetMethod === 'email') {
      lastEmail.current = email;
      setEmail('');
      setPhoneNumber('');
      setResetMethod('phone');
      onMethodChange('phone');
    } else {
      lastPhone.current = phoneNumber;
      setEmail('');
      setPhoneNumber('');
      setResetMethod('email');
      onMethodChange('email');
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
        lastEmail.current = normalizedEmail;
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

    const appVerifier = recaptchaVerifierRef.current;
    if (!appVerifier) {
      toast.error('reCAPTCHA not initialized. Please wait a moment and try again.');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password/phone`, { phoneNumber: normalizedPhone });

      const auth = getFirebaseAuth();
      const confirmationResult = await signInWithPhoneNumber(auth, normalizedPhone, appVerifier);

      toast.success('OTP sent to your phone');
      lastPhone.current = normalizedPhone;
      onOTPSent({
        method: 'phone',
        value: normalizedPhone,
        confirmationResult,
      });
    } catch (error) {
      if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/invalid-phone-number') {
        toast.error('Firebase rejected the phone number format');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to send OTP');
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
          {isPhone
            ? 'Enter your phone number to receive an OTP'
            : 'Enter your email to receive an OTP'}
        </p>
      </div>

      {isPhone && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 rounded-md text-sm rounded-md">
          If your account is linked with an <b>email</b>, please use the email reset option for faster otp and recovery.
        </div>
      )}

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
              placeholder="Email"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm font-medium text-white bg-green-600 hover:bg-green-700 ${
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
          className="w-full px-4 text-green-600 hover:text-green-700"
        >
          Back to Sign In
        </button>
      </form>

      {isPhone && <div id={RECAPTCHA_CONTAINER_ID} />}
    </div>
  );
}

export default ForgotPassword;
