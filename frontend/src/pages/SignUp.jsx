import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-hot-toast';
import InstallApp from '../components/auth/InstallApp';
import LanguageToggle from '../components/auth/LanguageToggle';
import CustomPhoneInput from '../components/auth/PhoneInput';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import GooglePhoneStep from '../components/auth/GooglePhoneStep';
import axios from 'axios';
import { API_URL } from '../utils/config';
import OTPVerification from '../components/auth/OTPVerification';
import SetPassword from '../components/auth/SetPassword';

function SignUp() {
  const { signup } = useAuth();
  const { language } = useLanguage();

  const [step, setStep] = useState(1);
  const [resetToken, setResetToken] = useState(null);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmitStep1 = async (e) => {
  e.preventDefault();

  if (formData.name.trim().length < 2) return toast.error("Enter valid name");

  if (formData.email) {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (!validEmail) return toast.error("Enter valid email");
  }

  const parsed = parsePhoneNumberFromString(
    formData.phoneNumber.replace(/^00/, '+')
  );
  if (!parsed || !parsed.isValid()) return toast.error("Enter valid phone number");

  setIsSubmitting(true);
  try {
    const { data } = await axios.post(`${API_URL}/api/auth/signup/check`, {
      name: formData.name,
      email: formData.email?.trim() || undefined,
      phoneNumber: parsed.number,
    });

    setFormData((prev) => ({ ...prev, phoneNumber: parsed.number }));

    if (data.sendOtp) {
      toast.success(data.message);
      setStep(2);
    } else {
      setStep(3);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Validation failed");
  } finally {
    setIsSubmitting(false);
  }
};


  const handleOtpVerified = (token) => {
    setResetToken(token);
    setStep(3);
  };

  const handlePasswordSubmit = async (password) => {
    try {
      await signup({
        ...formData,
        password,
        language,
      });

      toast.success("Account created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
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

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }}></div>

      <div className="relative">
        {step === 1 && (
        <div className="absolute top-10 right-0">
          <LanguageToggle />
        </div>
      )}

        {step === 1 && (
          <form onSubmit={handleSubmitStep1} className="space-y-6">
            <div className="text-center">
              <h1 className="mt-2 text-4xl font-extrabold text-green-600">NBK YOUTH</h1>
              <h2 className="text-lg text-gray-600">Gangavaram</h2>
            </div>

            <input
              name="name"
              required
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />

            <input
              name="email"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />

            <CustomPhoneInput
              value={formData.phoneNumber}
              onChange={(val) => setFormData({ ...formData, phoneNumber: val })}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-4 py-2 rounded-md text-white bg-green-600 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Signing up...' : 'Sign up'}
          </button>

            <GoogleAuthButton onNewUser={(cred) => setGoogleCredential(cred)} />

            <div className="text-center">
              <span>Already have an account? </span>
              <a href="/signin" className="text-green-600 font-medium">Sign in</a>
            </div>

    <p className="text-[11px] text-gray-500 text-center leading-snug">
  By signing up, you agree to our{" "}
  <a href="/terms_of_service.html" className="text-green-600">Terms</a>
  {" "}and{" "}
  <a href="/privacy_policy.html" className="text-green-600">Privacy Policy</a>.
</p>
          </form>
        )}

        {step === 2 && (
          <OTPVerification
            method="email"
            identifier={formData.email}
            onVerified={handleOtpVerified}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <SetPassword
            resetToken={resetToken}
            onSuccess={(password) => handlePasswordSubmit(password)}
            onBack={() => setStep(formData.email ? 2 : 1)}
          />
        )}
      </div>

      <InstallApp />
    </>
  );
}

export default SignUp;
