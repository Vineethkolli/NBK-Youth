import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import InstallApp from '../components/auth/InstallApp';
import LanguageToggle from '../components/auth/LanguageToggle';
import CustomPhoneInput from '../components/auth/PhoneInput';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import GooglePhoneStep from '../components/auth/GooglePhoneStep';

function SignUp() {
  const { signup } = useAuth();
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [googleCredential, setGoogleCredential] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return toast.error("Enter a valid email");
    }

    const parsed = parsePhoneNumberFromString(
      formData.phoneNumber.replace(/^00/, '+')
    );
    if (!parsed || !parsed.isValid()) {
      return toast.error("Enter a valid phone number");
    }

    if (formData.password.length < 4) {
      return toast.error("Password must be 4+ characters");
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setIsSubmitting(true);
    try {
      await signup({
        ...formData,
        phoneNumber: parsed.number,
        language
      });
      toast.success("Account created successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
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

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }}></div>

      <div className="relative">
        <div className="absolute top-10 right-0">
          <LanguageToggle />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full border rounded-md py-2 px-3"
          />

          <input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-md py-2 px-3"
          />

          <CustomPhoneInput
            value={formData.phoneNumber}
            onChange={(val) => setFormData({ ...formData, phoneNumber: val })}
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border rounded-md py-2 px-3"
            />

            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-2 text-gray-500"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              required
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded-md py-2 px-3"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute right-3 top-2 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 rounded-md text-white bg-green-600 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? "Signing up..." : "Sign up"}
          </button>

          <GoogleAuthButton onNewUser={(cred) => setGoogleCredential(cred)} />

          <div className="text-center">
            <span>Already have an account? </span>
            <a href="/signin" className="text-green-600 font-medium">Sign in</a>
          </div>
        </form>
      </div>

      <InstallApp />
    </>
  );
}

export default SignUp;
