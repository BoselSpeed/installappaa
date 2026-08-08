import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { appSettingsService } from '../firebase/service';
import { useTranslation } from 'react-i18next';

const AppSettingsContext = createContext(null);

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setSettings({
        id: 'default',
        userId: 'default',
        language: 'ar',
        fontSize: 'medium',
        theme: 'light'
      });
      setLoading(false);
      return;
    }

    const loadSettings = async () => {
      setLoading(true);
      try {
        const userSettings = await appSettingsService.getAppSettings(userId);
        setSettings(userSettings);
        if (userSettings.language !== i18n.language) {
          i18n.changeLanguage(userSettings.language);
        }
      } catch (error) {
        console.error('Error fetching app settings:', error);
        setSettings({
          id: 'default',
          userId: userId,
          language: 'ar',
          fontSize: 'medium',
          theme: 'light'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userId, i18n]);

  const updateUserId = useCallback((id) => {
    setUserId(id);
    localStorage.setItem('userId', id);
  }, []);

  const updateLanguage = useCallback(async (language) => {
    try {
      await appSettingsService.saveAppSettings({
        ...settings,
        language
      });
      setSettings(prev => prev ? { ...prev, language } : prev);
      await i18n.changeLanguage(language);
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  }, [settings, i18n]);

  const updateFontSize = useCallback(async (fontSize) => {
    try {
      await appSettingsService.saveAppSettings({
        ...settings,
        fontSize
      });
      setSettings(prev => prev ? { ...prev, fontSize } : prev);
    } catch (error) {
      console.error('Error updating font size:', error);
      throw error;
    }
  }, [settings]);

  const updateTheme = useCallback(async (theme) => {
    try {
      await appSettingsService.saveAppSettings({
        ...settings,
        theme
      });
      setSettings(prev => prev ? { ...prev, theme } : prev);
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  }, [settings]);

  return (
    <AppSettingsContext.Provider value={{ settings, loading, updateUserId, updateLanguage, updateFontSize, updateTheme, t }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
