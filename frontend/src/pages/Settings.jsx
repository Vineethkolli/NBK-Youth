import { Download, Languages, Bell } from 'lucide-react';
import InstallApp from '../components/settings/InstallApp';
import Footer from '../components/Footer';
import Notifications from '../components/settings/NotificationSettings';
import { useLanguage } from '../context/LanguageContext';

function Settings() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="max-w-1xl mx-auto">
      <div className="space-y-8">
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
              className={`px-4 py-2 rounded-md notranslate ${
                language === 'en' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              English
            </button>
            <button 
              onClick={() => changeLanguage('te')}
              className={`px-4 py-2 rounded-md ${
                language === 'te' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              తెలుగు
            </button>
          </div>
          <div id="google_translate_element" className={language === 'te' ? '' : 'hidden'}></div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Bell className="mr-2" /> Notifications
          </h3>
          <Notifications />
        </div>

        {/* Install App Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Download className="mr-2" /> Download App
          </h3>
          <InstallApp />
        </div>
      </div>

      <div className="text-center text-gray-500 text-sm mt-4">WEB APP Version 8.0 </div>
      <div className="text-center text-gray-500 text-sm mt-4">
        For any queries, write an email to <a href="mailto:gangavaramnbkyouth@gmail.com" className=" hover:text-indigo-600">gangavaramnbkyouth@gmail.com</a>
      </div>
      
      <Footer />
    </div>
  );
}

export default Settings;
