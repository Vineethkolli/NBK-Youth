import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { auth } from '../../utils/firebase';

function OTPVerification({ userInfo, onVerified, onBack }) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = otpValues.join('');
    if (otp.length < OTP_LENGTH) return toast.error('Enter complete OTP');

    setIsLoading(true);
    try {
      if (userInfo.method === 'email') {
        const { data } = await axios.post(`${API_URL}/api/auth/verify-otp`, {
          email: userInfo.value,
          otp,
        });
        onVerified(data.resetToken);
      } else {
        const confirmationResult = window.confirmationResult;
        await confirmationResult.confirm(otp);
        // Firebase verified successfully
        const resetToken = btoa(userInfo.value); // simple encoded token for consistency
        onVerified(resetToken);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600">Enter OTP</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter the 6-digit code sent to {userInfo.value}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center space-x-2">
          {otpValues.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              ref={(el) => (inputsRef.current[idx] = el)}
              className="w-10 h-12 text-center border rounded-md focus:ring-2 focus:ring-green-500"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 bg-green-600 text-white rounded-md ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 text-green-600 hover:text-green-700"
        >
          Back
        </button>
      </form>
    </div>
  );
}

export default OTPVerification;
