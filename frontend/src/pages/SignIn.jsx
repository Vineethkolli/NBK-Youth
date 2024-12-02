import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import ForgotPassword from '../components/auth/ForgotPassword';
import OTPVerification from '../components/auth/OTPVerification';
import ResetPassword from '../components/auth/ResetPassword';

function SignIn() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [resetFlow, setResetFlow] = useState({
    step: 'signin', // signin, forgot, otp, reset
    email: '',
    resetToken: ''
  });
  const { signin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signin(identifier, password);
      toast.success('Signed in successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sign in');
    }
  };

  const handleOTPSent = (email) => {
    setResetFlow({ ...resetFlow, step: 'otp', email });
  };

  const handleOTPVerified = (resetToken) => {
    setResetFlow({ ...resetFlow, step: 'reset', resetToken });
  };

  const handlePasswordReset = () => {
    setResetFlow({ step: 'signin', email: '', resetToken: '' });
  };

  if (resetFlow.step === 'forgot') {
    return (
      <ForgotPassword
        onBack={() => setResetFlow({ ...resetFlow, step: 'signin' })}
        onOTPSent={handleOTPSent}
      />
    );
  }

  if (resetFlow.step === 'otp') {
    return (
      <OTPVerification
        email={resetFlow.email}
        onVerified={handleOTPVerified}
        onBack={() => setResetFlow({ ...resetFlow, step: 'forgot' })}
      />
    );
  }

  if (resetFlow.step === 'reset') {
    return (
      <ResetPassword
        resetToken={resetFlow.resetToken}
        onSuccess={handlePasswordReset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <input
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Email or Phone Number"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Sign in
        </button>
      </div>

      <div className="text-sm text-center">
        <p className="text-black">
          Don't have an account?{'  '}
          <a href="/signup" className="font-medium text-green-600 hover:text-green-500">
            Sign up
          </a>
        </p>
      </div>
      <div className="text-sm text-center">
        <p className="text-black">
          Forgot password?{'  '}
        <button
          type="button"
          onClick={() => setResetFlow({ ...resetFlow, step: 'forgot' })}
          className="font-medium text-green-600 hover:text-green-500"
        >
          Reset
        </button>
        </p>
      </div>
    </form>
  );
}

export default SignIn;