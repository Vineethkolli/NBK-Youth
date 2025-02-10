// frontend/src/context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.language) {
      setLanguage(user.language);
      initializeTranslation(user.language);
    }
  }, [user]);

  const initializeTranslation = (lang) => {
    if (lang === 'te') {
      // Load the Google Translate script if it isn't already loaded.
      if (!document.getElementById("google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
      }
      
      // This callback is executed once the Google Translate script is loaded.
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "te",
            autoDisplay: false,
          },
          "google_translate_element"
        );
        // Wait for the Google Translate dropdown to appear and force Telugu.
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
    } else if (lang === 'en') {
      // If the language is English, remove any translation-related artifacts.
      const container = document.getElementById("google_translate_element");
      if (container) {
        container.innerHTML = "";
      }
      const script = document.getElementById("google-translate-script");
      if (script) {
        script.remove();
      }
      const gtFrame = document.querySelector('iframe.goog-te-banner-frame');
      if (gtFrame) {
        gtFrame.style.display = 'none';
      }
    }
  };

  const changeLanguage = async (newLanguage) => {
    // If the user is logged in, update the preference on the server.
    if (user) {
      try {
        await axios.patch(`${API_URL}/api/users/language`, { language: newLanguage });
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
    // Update the local language state and trigger translation initialization.
    setLanguage(newLanguage);
    initializeTranslation(newLanguage);
    
    // If switching back to English, you may want to reload the page to revert translations.
    if (newLanguage === 'en') {
      window.location.reload();
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
