import { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID } from "../../utils/config";
import axios from "axios";
import { API_URL } from "../../utils/config";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function GoogleLinkButton({ onLinked }) {
  const { user, updateUserData } = useAuth();
  const buttonRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;

    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCallback,
      });

      window.google?.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
      });
    };

    document.body.appendChild(script);
  }, []);

  const handleCallback = async (response) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/profile/link-google`, {
        credential: response.credential,
      });

      toast.success("Google account linked successfully");

      updateUserData({ ...user, googleId: data.googleId });

      onLinked?.();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to link Google account",
        { duration: 7000 }
      );
    }
  };

  const triggerGoogle = () => {
    const btn = buttonRef.current?.querySelector("div[role=button]");
    if (btn) btn.click();
  };

  return (
    <>
      <div ref={buttonRef} className="hidden"></div>

      <button
        onClick={triggerGoogle}
        className="inline-flex items-center px-3 py-2 border border-transparent 
                 text-sm font-medium rounded-md shadow-sm text-white 
                 bg-green-700 hover:bg-green-800"
      >
        Link Google Account
      </button>
    </>
  );
}
