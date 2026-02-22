
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings } from '@/types';
import { SettingsService, DEFAULT_SETTINGS } from '@/services/settingsService';

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean; // True only during initial fetch
  error: string | null; // Contains error message if fetch failed
  isReady: boolean; // True if fetch completed (success or fail)
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  error: null,
  isReady: false,
  updateSettings: async () => { },
  refreshSettings: async () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await SettingsService.getSettings();
      setSettings(data);
      setError(null);
    } catch (err: unknown) {
      console.error('CRITICAL: Failed to load global settings.', err);
      const message = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(message);
    } finally {
      setLoading(false);
      setIsReady(true);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply Theme & Metadata Side Effects (Safe Mode: Only applies if we have data)
  useEffect(() => {
    // 1. Update Title
    document.title = settings.store_name || 'Yalla Wasel';

    // 2. Update Theme Class on Root
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-luxury');
    // Default to 'light' if theme is missing/corrupted
    const validTheme = ['light', 'dark', 'luxury'].includes(settings.theme) ? settings.theme : 'light';
    root.classList.add(`theme-${validTheme}`);

    // 3. Handle Dark Mode for Tailwind specifically
    if (validTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 4. Update Favicon (Dynamic)
    if (settings.logo_url) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) link.href = settings.logo_url;
    }

  }, [settings]);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    // Optimistic Update
    setSettings(prev => ({ ...prev, ...newSettings }));

    try {
      await SettingsService.updateSettings(newSettings);
      setError(null); // Clear error on successful save
    } catch (err: unknown) {
      console.error('Failed to persist settings:', err);
      setError('Failed to save changes. System is running on cached/default config.');
      // Revert on failure (optional, or just warn)
      fetchSettings();
      throw err;
    }
  };

  const value = React.useMemo(() => ({
    settings,
    loading,
    error,
    isReady,
    updateSettings,
    refreshSettings: fetchSettings
  }), [settings, loading, error, isReady, updateSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
