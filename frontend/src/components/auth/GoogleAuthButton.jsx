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
        // Explicitly disable auto_select to prevent automatic sign-in behaviors
        auto_select: false,
      });

      window.google?.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        {
          type: "standard",
          theme: "outline",
          size: "large",
          // Changed from 'continue_with' to 'signin_with' 
          // This prevents "Continue as [Name]" and strictly shows "Sign in with Google"
          text: "continue_with", 
          logo_alignment: "left"
        }
      );
    };

    document.body.appendChild(script);
    
    return () => {
      if(document.body.contains(script)) {
        document.body.removeChild(script);
      }
    }
  }, []);

   return (
    <div className="flex justify-center w-full">
      <div id="google-signin-button"></div>
    </div>
  );
}
