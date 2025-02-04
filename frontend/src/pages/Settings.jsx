import { useState, useEffect } from 'react';
import { Download, Share2, Home, Lightbulb, Rocket } from 'lucide-react';
import InstallApp from '../components/settings/InstallApp';
import Notifications from '../components/settings/Notifications';

function Settings() {
  const [translate, setTranslate] = useState(false);
  
  useEffect(() => {
    if (translate) {
      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
  
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "te",
            autoDisplay: false,
          },
          "google_translate_element"
        );
        const observer = new MutationObserver(() => {
          const selectLang = document.querySelector(".goog-te-combo");
          if (selectLang) {
            selectLang.value = "te";
            selectLang.dispatchEvent(new Event("change"));
            observer.disconnect();
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      };
    }
  }, [translate]);

  return (
    <div className="max-w-1xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-8">
        <h2 className="text-2xl font-semibold">Settings</h2>

        {/* Translate Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">Translate Website</h3>
          <button 
            onClick={() => setTranslate(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Translate to Telugu
          </button>
          <div id="google_translate_element"></div>
        </div>

        {/* Notifications Section */}
        <Notifications />

        {/* Install App Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Download className="mr-2" /> Install App
          </h3>
          <InstallApp />
          </div>
        </div>
    </div>
  );
}

export default Settings;