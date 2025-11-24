import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const createTranslationContainer = () => {
  let container = document.getElementById('google_translate_element');
  if (!container) {
    container = document.createElement('div');
    container.id = 'google_translate_element';
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
    initializeTranslation(storedLang);
  }, [user]);

  // Initialize translation
  const initializeTranslation = (lang) => {
    return new Promise((resolve) => {
      if (lang === 'te') {
        // Remove any existing Google Translate script and clear container
        const existingScript = document.getElementById('google-translate-script');
        if (existingScript) {
          existingScript.remove();
        }
        const container = createTranslationContainer();
        container.innerHTML = '';

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
          } catch (err) {
            console.error('Translate element init error', err);
            resolve();
          }

          // Poll until the language dropdown is available, then switch to Telugu
          const interval = setInterval(() => {
            const selectLang = document.querySelector('.goog-te-combo');
            if (selectLang) {
              selectLang.value = 'te';
              selectLang.dispatchEvent(new Event('change'));
              clearInterval(interval);
              resolve();
            }
          }, 500);

          setTimeout(() => {
            try {
              const selectLang = document.querySelector('.goog-te-combo');
              if (selectLang) {
                selectLang.value = 'te';
                selectLang.dispatchEvent(new Event('change'));
              }
            } catch (e) {
            }
            resolve();
          }, 10000);
        };

        // Load Google Translate script
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src =
          'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
      } else {
        // For English, remove translation elements if they exist and resolve
        const container = document.getElementById('google_translate_element');
        if (container) container.innerHTML = '';

        const script = document.getElementById('google-translate-script');
        if (script) script.remove();

        const gtFrame = document.querySelector('iframe.goog-te-banner-frame');
        if (gtFrame) gtFrame.style.display = 'none';
        resolve();
      }
    });
  };

  const changeLanguage = async (newLanguage) => {
    setIsChanging(true);
    setChangingTo(newLanguage);

    localStorage.setItem('preferredLanguage', newLanguage);
    if (user) {
      try {
        await api.patch(`/api/profile/language`, {
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
