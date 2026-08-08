import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const SettingsPage = () => {
  const { settings, updateLanguage, updateFontSize, loading } = useAppSettings();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-black">{t('settings')}</h1>

        <div className="space-y-8">
          {/* Language Settings */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-black">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('language')}</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => updateLanguage('ar')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  settings?.language === 'ar'
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-black hover:bg-gray-50'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => updateLanguage('en')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  settings?.language === 'en'
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-black hover:bg-gray-50'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Font Size Settings */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-black">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('display')}</h2>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{t('font_size')}:</span>
              <div className="flex space-x-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => updateFontSize(size)}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      settings?.fontSize === size
                        ? 'bg-black text-white'
                        : 'bg-white text-black border border-black hover:bg-gray-50'
                    }`}
                  >
                    {t(size)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-black">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('about')}</h2>
            <div className="space-y-2 text-gray-600">
              <p><strong>{t('app_name')}</strong></p>
              <p>{t('version')}: 1.0.0</p>
            </div>
          </div>

          {/* Legal */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-black">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('legal') || 'Legal'}</h2>
            <div className="space-y-2">
              <a href="#" className="block text-black hover:text-gray-600">
                {t('privacy_policy')}
              </a>
              <a href="#" className="block text-black hover:text-gray-600">
                {t('terms_of_use')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SettingsPage };
