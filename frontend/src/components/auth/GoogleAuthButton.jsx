import { useEffect } from "react";
import { GOOGLE_CLIENT_ID } from '../../utils/config'; 
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

export default function GoogleAuthButton({ onNewUser }) {
  const { googleAuth } = useAuth();

  const handleGoogleCallback = async (response) => {
    try {
      await googleAuth(response.credential);
      toast.success("Signed in successfully");
    } catch (err) {
      const msg = err.response?.data?.message;

      if (msg?.includes("Phone number required")) {
        onNewUser(response.credential);
        return;
      }

      toast.error(msg || "Google sign-in failed");
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;

    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        // *** ADD THESE TWO PROPERTIES ***
        // 1. Ensures ITP (Intelligent Tracking Prevention) support, 
        //    often preventing unexpected behavior.
        itp_support: true,
        // 2. The most direct way to suppress the automatic One Tap prompt
        //    which shows the user's account in production.
        prompt_parent_id: "google-signin-button", 
      });

      window.google?.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        {
          type: "standard",
          theme: "outline",
          size: "large",
          // This ensures the button text is "Continue with Google"
          text: "continue_with", 
        }
      );
    };

    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex justify-center w-full">
      <div id="google-signin-button"></div>
    </div>
  );
}
