import { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function OTPVerification({ method, identifier, onVerified, onBack }) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      if (method === 'email') {
        // Email OTP verification (backend)
        const { data } = await axios.post(`${API_URL}/api/auth/verify-otp`, {
          email: identifier,
          otp,
        });
        onVerified(data.resetToken);
      } else {
        // Firebase phone OTP verification
        const confirmationResult = window.confirmationResult;
        await confirmationResult.confirm(otp);
        toast.success('Phone verified successfully');

        // Request backend to generate reset token for this phone
        const { data } = await axios.post(`${API_URL}/api/auth/generate-reset-token-phone`, {
          phone: identifier,
        });

        onVerified(data.resetToken);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-green-600">Verify OTP</h2>
      <p className="text-sm text-gray-600 mt-1">
        {method === 'email'
          ? `Enter the OTP sent to ${identifier}`
          : `Enter the OTP sent to your phone`}
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          maxLength="6"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter 6-digit OTP"
          className="w-full px-3 py-2 border rounded-md text-center focus:ring-green-500 focus:border-green-500"
        />

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 ${
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
