import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n';
import { AuthProvider } from './../hooks/useAuth';
import { AppSettingsProvider } from './../hooks/useAppSettings';
import { UserProgressProvider } from './../hooks/useUserProgress';

const AppProviders = ({ children }) => {
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
