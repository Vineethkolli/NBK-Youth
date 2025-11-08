import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../../utils/firebase";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_URL } from "../../utils/config";

export function initRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => console.log("reCAPTCHA verified"),
    });
  }
}

export async function sendPhoneOTP(phoneNumber) {
  try {
    // 1️⃣ Check user existence
    const res = await axios.post(`${API_URL}/api/auth/check-phone`, { phone: phoneNumber });
    if (!res.data?.exists) {
      toast.error("User not found");
      throw new Error("User not found");
    }

    // 2️⃣ Init Recaptcha + send OTP
    initRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    window.confirmationResult = confirmationResult;

    toast.success("OTP sent to your phone number");
    return confirmationResult;
  } catch (err) {
    if (err.message === "User not found") return;

    console.error("OTP send failed:", err);
    const message =
      err.response?.data?.message ||
      (err.code === "auth/invalid-phone-number"
        ? "Invalid phone number format"
        : "Failed to send OTP. Please try again.");
    toast.error(message);
    throw err;
  }
}

export async function verifyPhoneOTP(otp) {
  try {
    const confirmationResult = window.confirmationResult;
    if (!confirmationResult) throw new Error("OTP session expired. Please resend.");

    const result = await confirmationResult.confirm(otp);
    toast.success("OTP verified successfully!");
    return result.user;
  } catch (err) {
    console.error("Firebase OTP verification failed:", err);
    toast.error("Invalid or expired OTP. Please try again.");
    throw err;
  }
}
