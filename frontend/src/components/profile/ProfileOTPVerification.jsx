import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function ProfileOTPVerification({ email, onVerified, onCancel }) {
  const OTP_LENGTH = 6;
  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
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

  const handleResendOTP = async () => {
    if (isResending) return;
    setIsResending(true);

    try {
      await axios.post(`${API_URL}/api/profile/send-email-otp`, {
        email: email,
      });

      toast.success('OTP resent to email');
      setOtpValues(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = otpValues.join('');

    if (otp.length < OTP_LENGTH) {
      toast.error('Please enter the complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email: email,
        otp,
      });
      
      // Pass the reset token back to parent
      onVerified(data.resetToken);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-indigo-600">Verify Email</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter the 6-digit code sent to {email}
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
                  className="w-10 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center text-sm mt-2">
              Didn't receive yet?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResending}
                className={`text-indigo-600 font-medium ${
                  isResending ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-700'
                }`}
              >
                {isResending ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 px-4 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileOTPVerification;
