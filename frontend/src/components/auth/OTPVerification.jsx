import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { API_URL } from '../../utils/config';
import { getFirebaseAuth } from '../../utils/firebase';

function OTPVerification({ method = 'email', identifier, confirmationResult, onVerified, onBack }) {
  const OTP_LENGTH = 6;
  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (e, idx) => {
    const val = e.target.value;
    if (/^[0-9]?$/.test(val)) {
      const newOtp = [...otpValues];
      newOtp[idx] = val;
      setOtpValues(newOtp);
      if (val && idx < OTP_LENGTH - 1) {
        inputsRef.current[idx + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpValues[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const displayTarget = method === 'phone'
    ? (identifier ? identifier.replace(/.(?=.{4})/g, '*') : 'your phone number')
    : identifier || 'your email';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = otpValues.join('');
    if (otp.length < OTP_LENGTH) {
      toast.error('Please enter the complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      if (method === 'phone') {
        if (!confirmationResult) {
          toast.error('Missing OTP session. Please request a new code.');
          return;
        }

        await confirmationResult.confirm(otp);

        try {
          await signOut(getFirebaseAuth());
        } catch (signOutError) {
          console.warn('Firebase signOut failed after OTP confirmation:', signOutError);
        }

        const { data } = await axios.post(`${API_URL}/api/auth/forgot-password/phone/token`, {
          phoneNumber: identifier,
        });

        onVerified(data.resetToken);
      } else {
        const { data } = await axios.post(`${API_URL}/api/auth/verify-otp`, {
          email: identifier,
          otp,
        });
        onVerified(data.resetToken);
      }
    } catch (error) {
      if (error.code === 'auth/invalid-verification-code') {
        toast.error('Invalid OTP. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        toast.error('OTP expired. Please request a new code.');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Invalid OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600">Enter OTP</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter the 6-digit code sent to {displayTarget}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center space-x-2">
          {otpValues.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              ref={(el) => (inputsRef.current[idx] = el)}
              className="w-10 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm font-medium text-white bg-green-600 hover:bg-green-700 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 px-4 text-green-600 hover:text-green-700"
        >
          Back
        </button>
      </form>
    </div>
  );
}

export default OTPVerification;
