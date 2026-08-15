import { useState } from 'react';
import { useAppSettings } from '../hooks/useAppSettings';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { isDemoMode } from '../firebase/service';

const SettingsPage = () => {
  const { settings, updateLanguage, updateFontSize, loading } = useAppSettings();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState('');

  const handleLogout = async () => {
    const result = await logout();
    setStatus(result.success ? t('signed_out') : result.error);
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      setStatus(t('cache_cleared'));
      setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setStatus(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-black">{t('settings')}</h1>

        {status && (
          <div className="mb-6 p-4 bg-gray-100 border border-black rounded">
            <p className="text-sm text-black">{status}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Account */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-black">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('account')}</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">{user?.email || t('guest')}</p>
                {isDemoMode && (
                  <p className="text-sm text-gray-400 mt-1">{t('demo_mode')}</p>
                )}
              </div>
              {user && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-50 transition-colors"
                >
                  {t('sign_out')}
                </button>
              )}
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-black">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('language')}</h2>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
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
            <div className="mb-4">
              <span className="text-gray-600">{t('font_size')}:</span>
              <div className="flex space-x-2 rtl:space-x-reverse mt-3">
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
            <p className={`mt-4 text-gray-800 border-t border-gray-200 pt-4 ${
              settings?.fontSize === 'small' ? 'text-sm' : settings?.fontSize === 'large' ? 'text-lg' : 'text-base'
            }`}>
              {t('font_preview')}
            </p>
          </div>

          {/* Data */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-black">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('data')}</h2>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-50 transition-colors"
            >
              {t('clear_cache')}
            </button>
          </div>

          {/* About */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-black">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('about')}</h2>
            <div className="space-y-2 text-gray-600">
              <p><strong>{t('app_name')}</strong></p>
              <p>{t('version')}: 0.1.0</p>
            </div>
          </div>

          {/* Legal */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-black">
            <h2 className="text-xl font-semibold mb-4 text-black">{t('legal')}</h2>
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
