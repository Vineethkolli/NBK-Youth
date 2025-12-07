import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const createTranslationContainer = () => {
  let container = document.getElementById('google_translate_element');
  if (!container) {
    container = document.createElement('div');
    container.id = 'google_translate_element';
    container.style.display = 'none';
    document.body.appendChild(container);
  }
  return container;
};

export const LanguageProvider = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguage] = useState(
    localStorage.getItem('preferredLanguage') || 'en'
  );
  const [isChanging, setIsChanging] = useState(false);
  const [changingTo, setChangingTo] = useState(null);

  useEffect(() => {
    let storedLang;
    if (user?.language) {
      storedLang = user.language;
      localStorage.setItem('preferredLanguage', user.language);
    } else {
      storedLang = localStorage.getItem('preferredLanguage') || 'en';
    }
    setLanguage(storedLang);
    
    // Initialize script once if needed
    if (storedLang === 'te') {
      initializeTranslation('te');
    }
  }, [user]);

  // Initialize translation
  const initializeTranslation = (lang) => {
    return new Promise((resolve) => {
      const container = createTranslationContainer();
      
      // If script is already loaded, just trigger change
      if (window.google?.translate?.TranslateElement) {
        triggerLanguageChange(lang);
        resolve();
        return;
      }

      // If script tag exists but not initialized, wait? 
      // Or if we are here, maybe we should just ensure script is loaded.
      if (document.getElementById('google-translate-script')) {
         // Script exists but maybe not ready. 
         // We can rely on the callback if it was just added, or check periodically.
         // For simplicity, let's assume if script exists, we wait for it.
         resolve();
         return;
      }

      // Define the callback for Google Translate
      window.googleTranslateElementInit = () => {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'te,en',
              autoDisplay: false,
            },
            'google_translate_element'
          );
          
          // Once initialized, trigger the language change
          triggerLanguageChange(lang);
          resolve();
        } catch (err) {
          console.error('Translate element init error', err);
          resolve();
        }
      };

      // Load Google Translate script
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    });
  };

  const triggerLanguageChange = (lang) => {
    if (lang === 'te') {
        const interval = setInterval(() => {
          const selectLang = document.querySelector('.goog-te-combo');
          if (selectLang) {
            if (selectLang.value !== 'te') {
                selectLang.value = 'te';
                selectLang.dispatchEvent(new Event('change'));
            }
            clearInterval(interval);
          }
        }, 500);
        
        // Timeout to stop polling
        setTimeout(() => clearInterval(interval), 10000);
    }
  };

  const changeLanguage = async (newLanguage) => {
    setIsChanging(true);
    setChangingTo(newLanguage);

    localStorage.setItem('preferredLanguage', newLanguage);
    if (user) {
      try {
        await axios.patch(`${API_URL}/api/profile/language`, {
          language: newLanguage,
        });
      } catch (error) {
        console.error('Failed to update language on server', error);
      }
    }

    try {
      await initializeTranslation(newLanguage);
    } catch (e) {
      console.error('initializeTranslation error', e);
    }

    setLanguage(newLanguage);
    setIsChanging(false);
    setChangingTo(null);

    if (newLanguage === 'en') {
      // Reloading the page ensures that the default English state is applied
      window.location.reload();
    }
  };

  return (
    <LanguageContext.Provider
      value={{ language, changeLanguage, isChanging, changingTo }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
