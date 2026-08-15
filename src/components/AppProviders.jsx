import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n';
import { AuthProvider } from './../hooks/useAuth';
import { AppSettingsProvider } from './../hooks/useAppSettings';
import { UserProgressProvider } from './../hooks/useUserProgress';

const AppProviders = ({ children }) => {
  useEffect(() => {
    const applyLanguage = () => {
      const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    };

    applyLanguage();
    i18n.on('languageChanged', applyLanguage);
    return () => i18n.off('languageChanged', applyLanguage);
  }, []);

  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <AppSettingsProvider>
            <UserProgressProvider>
              {children}
            </UserProgressProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
};

export { AppProviders };
