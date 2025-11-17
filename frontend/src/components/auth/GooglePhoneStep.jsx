import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import CustomPhoneInput from "./PhoneInput";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "react-hot-toast";

export default function GooglePhoneStep({ credential, onCancel }) {
  const { googleAuth } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const submitPhone = async () => {
    const parsed = parsePhoneNumberFromString(phone.replace(/^00/, "+"));
    if (!parsed?.isValid()) {
      return toast.error("Please enter a valid phone number");
    }

    setLoading(true);

    try {
      await googleAuth(credential, parsed.number);
      toast.success("Account created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">

      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600">Complete Signup</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter your Phone Number
        </p>
      </div>

      <div>
        <CustomPhoneInput value={phone} onChange={setPhone} />
      </div>

      <button
        onClick={submitPhone}
        disabled={loading}
        className={`w-full flex justify-center px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm font-medium
        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? "Signing up..." : "Sign up"}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full text-green-600 hover:text-green-700 px-4 text-center"
      >
        Cancel
      </button>

    </div>
  );
}
