import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (s) setSettings(JSON.parse(s));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }, 1000);
    return () => clearTimeout(id);
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return { settings, setSettings, updateSetting };
}
