import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_URL } from "../../utils/config";
import { verifyPhoneOTP } from "./PhoneOtpService"; // ✅ Firebase verification function

function OTPVerification({ identifier, onVerified, onBack }) {
  /**
   * `identifier` can be:
   * - an email (string containing "@")
   * - a phone number (starts with "+")
   */

  const isPhoneMode = identifier.startsWith("+");
  const OTP_LENGTH = 6;
  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef([]);

  // Focus first input when mounted
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (e, idx) => {
    const val = e.target.value;
    if (/^[0-9]?$/.test(val)) {
      const newOtp = [...otpValues];
      newOtp[idx] = val;
      setOtpValues(newOtp);
      if (val && idx < OTP_LENGTH - 1) {
        inputsRef.current[idx + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otpValues[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = otpValues.join("");
    if (otp.length < OTP_LENGTH) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      if (isPhoneMode) {
        // 📱 PHONE MODE: Firebase handles verification
        const user = await verifyPhoneOTP(otp); // from PhoneOtpService.js
        if (user) {
          toast.success("Phone number verified successfully");
          onVerified(user); // user object returned by Firebase
        }
      } else {
        // 📧 EMAIL MODE: Backend handles verification
        const { data } = await axios.post(`${API_URL}/api/auth/verify-otp`, {
          email: identifier,
          otp,
        });
        toast.success("Email verified successfully");
        onVerified(data.resetToken); // backend gives reset token
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        (isPhoneMode ? "Invalid or expired OTP" : "Invalid OTP");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600">Enter OTP</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium">{identifier}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center space-x-2">
          {otpValues.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              ref={(el) => (inputsRef.current[idx] = el)}
              className="w-10 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
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
