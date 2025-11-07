import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import InstallApp from '../components/auth/InstallApp';
import LanguageToggle from '../components/auth/LanguageToggle';
import CustomPhoneInput from '../components/auth/PhoneInput';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation (if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      return toast.error('Please enter a valid email address');
    }

    // Phone number validation
    if (typeof formData.phoneNumber !== 'string' || !formData.phoneNumber.trim()) {
  return toast.error('Please enter a valid phone number');
}

const parsedPhone = parsePhoneNumberFromString(formData.phoneNumber.replace(/^00/, '+'));
if (!parsedPhone || !parsedPhone.isValid()) {
  return toast.error('Please enter a valid phone number');
}
formData.phoneNumber = parsedPhone.number;


    // Password length validation
    if (formData.password.length < 4) {
      return toast.error('Password must be at least 4 characters long');
    }

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setIsSubmitting(true);
    try {
      // Pass the current language along with form data
      await signup({ ...formData, language });
      toast.success('Account created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prevState) => !prevState);
  };

  return (
    <>
      {/* Hidden container for Google Translate */}
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
            <input
              type="text"
              name="name"
              required
              placeholder="Name *"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="mt-1">
  <CustomPhoneInput
    value={formData.phoneNumber}
    onChange={(val) => setFormData({ ...formData, phoneNumber: val })}
  />
</div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              placeholder="Password *"
              value={formData.password}
              onChange={handleChange}
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
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              required
              placeholder="Confirm Password *"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
              {isSubmitting ? 'Signing up...' : 'Sign up'}
            </button>
          </div>
          <div className="text-sm text-center">
            <span className="text-black">Already have an account? </span>
            <a
              href="/signin"
              className="font-medium text-green-600 hover:text-green-500"
            >
              Sign in
            </a>
          </div>
        </form>
      </div>
      
      {/* InstallApp component for app download prompt */}
      <InstallApp />
    </>
  );
}

export default SignUp;
