import { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';

function OTPVerification({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp
      });
      onVerified(data.resetToken);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Enter OTP</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter the 6-digit code sent to {email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            pattern="\d{6}"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
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