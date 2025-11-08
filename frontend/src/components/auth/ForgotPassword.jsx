import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_URL } from "../../utils/config";
import CustomPhoneInput from "./PhoneInput";
import { sendPhoneOTP } from "./PhoneOtpService";
import { parsePhoneNumberFromString } from "libphonenumber-js";

function ForgotPassword({ onBack, onOTPSent }) {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isPhoneMode) {
        // 📱 PHONE MODE
        if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
          toast.error("Please enter a valid phone number");
          return;
        }

        const parsed = parsePhoneNumberFromString(phoneNumber.replace(/^00/, "+"));
        if (!parsed || !parsed.isValid()) {
          toast.error("Please enter a valid phone number");
          return;
        }

        await sendPhoneOTP(parsed.number); // internally checks existence + sends OTP
        onOTPSent(parsed.number);
      } else {
        // 📧 EMAIL MODE
        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          toast.error("Please enter a valid email address");
          return;
        }

        const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
          email: normalizedEmail,
        });

        toast.success("OTP sent to your email");
        onOTPSent(normalizedEmail);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to send OTP";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600">Forgot Password</h2>
        <p className="text-sm text-gray-600 mt-1">
          {isPhoneMode
            ? "Enter your phone number to receive an OTP"
            : "Enter your email to receive an OTP"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          {isPhoneMode ? (
            <CustomPhoneInput value={phoneNumber} onChange={(val) => setPhoneNumber(val)} />
          ) : (
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          )}
        </div>

        <div id="recaptcha-container"></div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center px-4 py-2 border rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Sending..." : "Send OTP"}
        </button>

        <div className="text-sm text-center">
          <p className="text-black">
            {isPhoneMode ? (
              <>
                Reset using{" "}
                <button
                  type="button"
                  onClick={() => setIsPhoneMode(false)}
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  Email
                </button>
              </>
            ) : (
              <>
                Reset using{" "}
                <button
                  type="button"
                  onClick={() => setIsPhoneMode(true)}
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  Phone Number
                </button>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 px-4 text-green-600 hover:text-green-700"
        >
          Back to Sign In
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;
