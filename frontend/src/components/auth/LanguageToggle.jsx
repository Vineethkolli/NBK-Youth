import { Languages, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

function LanguageToggle() {
  const { language, changeLanguage, isChanging, changingTo } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'te' : 'en';
    changeLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="absolute top-1 right-0 flex items-center px-0.5 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors notranslate"
    >
      {isChanging && changingTo === 'te' ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Languages className="h-4 w-4 mr-1" />
      )}

      {isChanging && changingTo === 'te' ? 'తెలుగు' : language === 'en' ? 'తెలుగు' : 'English'}
    </button>
  );
}

export default LanguageToggle;
