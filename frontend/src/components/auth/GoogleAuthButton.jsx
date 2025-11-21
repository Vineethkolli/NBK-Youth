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

        // 🔥 FIX mobile auto prompt glitch
        auto_select: false,
        use_fedcm_for_prompt: false,
        prompt_parent_id: "google-signin-button",
      });

      // Render clean custom button
      window.google?.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        {
          type: "standard",
          theme: "outline",
          size: "large",
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
