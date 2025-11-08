import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react'; 
import ForgotPassword from '../components/auth/ForgotPassword';
import OTPVerification from '../components/auth/OTPVerification';
import ResetPassword from '../components/auth/ResetPassword';
import LanguageToggle from '../components/auth/LanguageToggle';
import InstallApp from '../components/auth/InstallApp';
import SmartAuthInput from "../components/auth/SmartAuthInput";

function SignIn() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const resetInitialState = {
    step: 'signin',
    method: 'email',
    identifier: '',
    resetToken: '',
    confirmationResult: null,
  };

  const [resetFlow, setResetFlow] = useState(resetInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signin } = useAuth();

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signin(identifier, password);
      toast.success('Signed in successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPSent = ({ method, value, confirmationResult }) => {
    setResetFlow((prev) => ({
      ...prev,
      step: 'otp',
      method,
      identifier: value,
      confirmationResult: confirmationResult || null,
    }));
  };

  const handleOTPVerified = (resetToken) => {
    setResetFlow((prev) => ({
      ...prev,
      step: 'reset',
      resetToken,
      confirmationResult: null,
    }));
  };

  const handlePasswordReset = () => {
    setResetFlow(resetInitialState);
  };

  if (resetFlow.step === 'forgot') {
    return (
      <ForgotPassword
        onBack={() => setResetFlow(resetInitialState)}
        onOTPSent={handleOTPSent}
        activeMethod={resetFlow.method}
        onMethodChange={(method) =>
          setResetFlow((prev) => ({ ...prev, method }))
        }
        initialIdentifier={resetFlow.identifier}
      />
    );
  }

  if (resetFlow.step === 'otp') {
    return (
      <OTPVerification
        method={resetFlow.method}
        identifier={resetFlow.identifier}
        confirmationResult={resetFlow.confirmationResult}
        onVerified={handleOTPVerified}
        onBack={() =>
          setResetFlow((prev) => ({
            ...prev,
            step: 'forgot',
            resetToken: '',
            confirmationResult: null,
          }))
        }
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
    <>
    {/* Google Translate */}
    <div id="google_translate_element" style={{ display: 'none' }}></div>
    <div className="relative ">
      <div className="absolute top-10 right-0">
        <LanguageToggle /> 
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
  <h1 className="mt-2 text-4xl md:text-3xl font-extrabold tracking-wide text-green-600">
    NBK YOUTH
  </h1>
  <h2 className="text-xl md:text-lg font-medium text-gray-600">
    Gangavaram
  </h2>
  </div> 
        <div>
          <SmartAuthInput
  value={identifier}
  onChange={(val) => setIdentifier(val)}
/>
        </div>

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'} 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        <div className="text-sm text-center">
          <p className="text-black">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-medium text-green-600 hover:text-green-500">
              Sign up
            </a>
          </p>
        </div>
        <div className="text-sm text-center">
          <p className="text-black">
            Forgot password?{' '}
            <button
              type="button"
              onClick={() =>
                setResetFlow((prev) => ({
                  ...prev,
                  step: 'forgot',
                }))
              }
              className="font-medium text-green-600 hover:text-green-500"
            >
              Reset
            </button>
          </p>
        </div>
      </form>
      </div>
     <div className="w-full max-w-md text-center mt-10">
  <p className="font-semibold text-gray-700 md:text-base tracking-wide">
    Developed by{" "}
    <span className="text-green-600 font-bold text-lg md:text-xl">
      Kolli Vineeth
    </span>
  </p>
</div>


      <InstallApp />
    </>
  );
}

export default SignIn;
