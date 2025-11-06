// Signup.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import InstallApp from '../components/auth/InstallApp';
import LanguageToggle from '../components/auth/LanguageToggle';

// NEW imports
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
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

  // Phone input helper states
  const [phoneActive, setPhoneActive] = useState(false); // start as plain input; on focus -> switch to PhoneInput
  const [detectedCountry, setDetectedCountry] = useState('in'); // iso2, default 'in'
  const phoneRef = useRef(null);

  useEffect(() => {
    // Detect country by IP (free public JSON) - optional; fallback to 'in'
    // Note: ipapi.co is free but can be rate-limited. If it fails we keep 'in'.
    (async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('no geo');
        const j = await res.json();
        if (j && j.country_code) {
          setDetectedCountry(String(j.country_code).toLowerCase());
        }
      } catch (err) {
        // ignore and keep 'in'
        setDetectedCountry('in');
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  // PhoneInput onChange
  const handlePhoneChange = (value /* E.164-ish or partial depending on input */, meta) => {
    // value is the component's value (may include prefix)
    // meta contains parsed country info and current inputValue
    setFormData((s) => ({ ...s, phoneNumber: value || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation (if provided)
    const normalizedEmail = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
      return toast.error('Please enter a valid email address');
    }

    // Phone number validation & normalization to E.164 using libphonenumber-js
    if (!formData.phoneNumber) {
      return toast.error('Please enter a valid phone number');
    }
    // try to parse. If the phone already includes +, parsing works. If not, try with detected country
    let parsed = parsePhoneNumberFromString(formData.phoneNumber);
    if (!parsed) {
      // try parsing with detected country
      parsed = parsePhoneNumberFromString(formData.phoneNumber, detectedCountry?.toUpperCase() || 'IN');
    }
    if (!parsed || !parsed.isValid()) {
      return toast.error('Please enter a valid phone number');
    }
    const normalizedE164 = parsed.format('E.164');

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
      // send normalized phone number
      await signup({ ...formData, phoneNumber: normalizedE164, email: normalizedEmail, language });
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
        <div className="absolute top-6 right-0">
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

          {/* ----- PHONE FIELD (replaces your old <input type="tel" />) ----- */}
          <div>
            {!phoneActive ? (
              // initial state: simple empty-looking input (no flag/code shown)
              <input
                type="tel"
                name="phoneNumber"
                required
                placeholder="Phone Number *"
                value={formData.phoneNumber}
                onChange={(e) => setFormData((s) => ({ ...s, phoneNumber: e.target.value }))}
                onFocus={() => setPhoneActive(true)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            ) : (
              // active state: show react-international-phone control
              <PhoneInput
                ref={phoneRef}
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                defaultCountry={detectedCountry || 'in'}   // iso2 code (ex: 'in')
                preferredCountries={['in']}
                forceDialCode={true}               // dial code can't be removed by backspace
                disableDialCodePrefill={false}     // show dial code once activated
                // you get searchable dropdown with flags and names by default
                inputProps={{
                  name: 'phoneNumber',
                  required: true,
                  placeholder: 'Enter phone number', // user's requested placeholder while active
                }}
                className="mt-1 block w-full"
                inputClassName="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            )}
          </div>
          {/* ----- end phone field ----- */}

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
