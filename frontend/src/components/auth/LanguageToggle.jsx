import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

function LanguageToggle() {
  const { language, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'te' : 'en';
    changeLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="absolute top-1 right-0 flex items-center px-0.5 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors notranslate"
    >
      <Languages className="h-4 w-4 mr-1" />
      {language === 'en' ? 'తెలుగు' : 'English'}
    </button>
  );
}

export default LanguageToggle;
