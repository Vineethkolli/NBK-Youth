import { useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { toast, Toaster } from "react-hot-toast";

// ✅ Read Firebase config from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.REACT_APP_FIREBASE_APP_ID,
};

// ✅ Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export default function DeveloperPhoneOTPTester() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => console.log("reCAPTCHA verified ✅"),
          "expired-callback": () => toast.error("reCAPTCHA expired, retry."),
        }
      );
    }
  };

  const sendOTP = async () => {
    try {
      if (!phone.startsWith("+")) {
        toast.error("Use full number with country code (e.g. +91XXXXXXXXXX)");
        return;
      }

      setLoading(true);
      generateRecaptcha();

      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);

      window.confirmationResult = confirmation;
      setOtpSent(true);
      toast.success("OTP sent successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setLoading(true);
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      toast.success("OTP verified successfully!");
      console.log("✅ Verified phone number:", user.phoneNumber);
      console.log("Firebase user:", user);
    } catch (err) {
      console.error(err);
      toast.error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      {/* Floating dev button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg"
      >
        🔧 Test OTP
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">
            Developer OTP Test
          </h3>

          <input
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-100 bg-transparent focus:ring-2 focus:ring-sky-500 outline-none mb-3"
          />

          {!otpSent ? (
            <button
              onClick={sendOTP}
              disabled={loading}
              className={`w-full py-2 rounded-lg font-medium ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700 text-white"
              }`}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-100 bg-transparent focus:ring-2 focus:ring-green-500 outline-none mt-3 mb-3"
              />

              <button
                onClick={verifyOTP}
                disabled={loading}
                className={`w-full py-2 rounded-lg font-medium ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          <div id="recaptcha-container"></div>

          <button
            onClick={() => {
              setOpen(false);
              setOtpSent(false);
              setOtp("");
              setPhone("");
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg mt-3"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
