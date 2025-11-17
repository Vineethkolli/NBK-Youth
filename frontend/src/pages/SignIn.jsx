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
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import GooglePhoneStep from '../components/auth/GooglePhoneStep';

function SignIn() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signin } = useAuth();
  const [googleCredential, setGoogleCredential] = useState(null);

  const resetInitialState = {
    step: 'signin',
    method: 'email',
    identifier: '',
    resetToken: '',
    confirmationResult: null,
  };

  const [resetFlow, setResetFlow] = useState(resetInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
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

  if (googleCredential) {
    return (
      <GooglePhoneStep
        credential={googleCredential}
        onCancel={() => setGoogleCredential(null)}
      />
    );
  }

  if (resetFlow.step === 'forgot') {
    return (
      <ForgotPassword
        onBack={() => setResetFlow(resetInitialState)}
        onOTPSent={({ method, value, confirmationResult }) =>
          setResetFlow({
            step: 'otp',
            method,
            identifier: value,
            confirmationResult,
          })
        }
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
        onVerified={(resetToken) =>
          setResetFlow((prev) => ({ ...prev, step: 'reset', resetToken }))
        }
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
        onSuccess={() => setResetFlow(resetInitialState)}
        onBack={() => setResetFlow(resetInitialState)}
      />
    );
  }

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      <div className="relative">
        <div className="absolute top-10 right-0">
          <LanguageToggle />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <h1 className="mt-2 text-4xl font-extrabold tracking-wide text-green-600">
              NBK YOUTH
            </h1>
            <h2 className="text-xl font-medium text-gray-600">
              Gangavaram
            </h2>
          </div>

          <SmartAuthInput
            value={identifier}
            onChange={(val) => setIdentifier(val)}
          />

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
              className="absolute inset-y-0 right-3 flex items-center text-gray-500"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 rounded-md text-white bg-green-600 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
 
          <GoogleAuthButton onNewUser={(cred) => setGoogleCredential(cred)} />

          <div className="text-center">
            <p>
              Don't have an account?{' '}
              <a href="/signup" className="text-green-600 font-medium">
                Sign up
              </a>
            </p>
          </div>

          <div className="text-center">
            <p>
              Forgot password?{' '}
              <button
                type="button"
                onClick={() =>
                  setResetFlow((prev) => ({ ...prev, step: 'forgot' }))
                }
                className="text-green-600 font-medium"
              >
                Reset
              </button>
            </p>
          </div>
        </form>
      </div>

      <div className="w-full max-w-md text-center mt-8">
        <p className="font-semibold text-gray-700">
          Developed by{' '}
          <span className="text-green-600 font-bold text-xl">
            Kolli Vineeth
          </span>
        </p>
      </div>

      <InstallApp />
    </>
  );
}

export default SignIn;
