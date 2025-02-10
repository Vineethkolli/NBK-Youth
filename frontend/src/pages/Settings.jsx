import { Download, Globe2Icon, Languages } from 'lucide-react';
import InstallApp from '../components/installapp/SettingsInstallApp';
import Footer from '../components/Footer';
import Notifications from '../components/settings/Notifications';
import { useLanguage } from '../context/LanguageContext';

function Settings() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="max-w-1xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 space-y-8">
        <h2 className="text-2xl font-semibold">Settings</h2>

        {/* Language Section */}
        <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center">
  <Languages className="mr-2" />
  Language Preference
</h3>

          <div className="flex space-x-4">
            <button 
              onClick={() => changeLanguage('en')}
              className={`px-4 py-2 rounded-md ${
                language === 'en' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              English
            </button>
            <button 
              onClick={() => changeLanguage('te')}
              className={`px-4 py-2 rounded-md ${
                language === 'te' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              తెలుగు
            </button>
          </div>
          {/* The translation widget container */}
          <div id="google_translate_element" className={language === 'te' ? '' : 'hidden'}></div>
        </div>

        {/* Notifications Section */}
        <Notifications />

        {/* Install App Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Download className="mr-2" /> Download App
          </h3>
          <InstallApp />
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Settings;
