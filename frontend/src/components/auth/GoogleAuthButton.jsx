import { useEffect } from "react";
import { GOOGLE_CLIENT_ID } from '../../utils/config'; 
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

export default function GoogleAuthButton({ onNewUser }) {
  const { googleAuth } = useAuth();

  const handleGoogleLogin = () => {
    if (!window.google) return;

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile openid",
      callback: async (response) => {
        if (response.access_token) {
          try {
            await googleAuth({ accessToken: response.access_token });
            toast.success("Signed in successfully");
          } catch (err) {
            const msg = err.response?.data?.message;
            if (msg?.includes("Phone number required")) {
              const googleUser = err.response?.data?.googleUser;
              onNewUser({ accessToken: response.access_token, googleUser });
              return;
            }
            toast.error(msg || "Google sign-in failed");
          }
        }
      },
    });
    client.requestAccessToken();
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (<div className="w-full flex justify-center">
  <button
    type="button"
    onClick={handleGoogleLogin}
    className="w-auto flex items-center justify-center gap-3 px-4 py-2 
               border border-gray-300 rounded-md shadow-sm bg-white 
               text-sm font-medium text-gray-700 hover:bg-gray-50 
               focus:outline-none focus:ring-1 focus:ring-green-500"
  >
    <FcGoogle className="h-5 w-5" />
    Continue with Google
  </button>
</div>

  );
}
