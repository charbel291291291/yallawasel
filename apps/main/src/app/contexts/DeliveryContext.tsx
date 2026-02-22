
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeliveryConfig, DeliverySettings, DeliveryZone, DeliveryDay } from '@/types';
import { DeliveryService, DEFAULT_DELIVERY_SETTINGS } from '@/services/deliveryService';

interface DeliveryContextType {
  config: DeliveryConfig;
  loading: boolean;
  refreshConfig: () => Promise<void>;
  updateSettings: (s: Partial<DeliverySettings>) => Promise<void>;
  upsertZone: (z: Partial<DeliveryZone>) => Promise<void>;
  deleteZone: (id: string) => Promise<void>;
  updateSchedule: (d: DeliveryDay) => Promise<void>;
  isOpenNow: () => boolean;
}

const DeliveryContext = createContext<DeliveryContextType>({
  config: { settings: DEFAULT_DELIVERY_SETTINGS, zones: [], schedule: [] },
  loading: true,
  refreshConfig: async () => { },
  updateSettings: async () => { },
  upsertZone: async () => { },
  deleteZone: async () => { },
  updateSchedule: async () => { },
  isOpenNow: () => true
});

export const useDelivery = () => useContext(DeliveryContext);

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<DeliveryConfig>({
    settings: DEFAULT_DELIVERY_SETTINGS,
    zones: [],
    schedule: []
  });
  const [loading, setLoading] = useState(true);

  const refreshConfig = async () => {
    try {
      const data = await DeliveryService.getConfig();
      setConfig(data);
    } catch (err) {
      console.error('DeliveryContext: Failed to load config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  const updateSettings = async (s: Partial<DeliverySettings>) => {
    // Optimistic
    setConfig(prev => ({ ...prev, settings: { ...prev.settings, ...s } }));
    await DeliveryService.updateSettings(s);
  };

  const upsertZone = async (z: Partial<DeliveryZone>) => {
    await DeliveryService.upsertZone(z);
    await refreshConfig(); // Refresh to get IDs if new
  };

  const deleteZone = async (id: string) => {
    setConfig(prev => ({ ...prev, zones: prev.zones.filter(z => z.id !== id) }));
    await DeliveryService.deleteZone(id);
  };

  const updateSchedule = async (d: DeliveryDay) => {
    setConfig(prev => ({
      ...prev,
      schedule: prev.schedule.map(day => day.day_of_week === d.day_of_week ? d : day)
    }));
    await DeliveryService.updateSchedule(d);
  };

  const isOpenNow = (): boolean => {
    if (!config.settings.enabled) return false;

    const now = new Date();
    const currentDay = now.getDay(); // 0-6
    const scheduleToday = config.schedule.find(d => d.day_of_week === currentDay);

    if (!scheduleToday || !scheduleToday.active) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = scheduleToday.open_time.split(':').map(Number);
    const [closeH, closeM] = scheduleToday.close_time.split(':').map(Number);

    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;

    return currentTime >= openTime && currentTime < closeTime;
  };

  return (
    <DeliveryContext.Provider value={{
      config,
      loading,
      refreshConfig,
      updateSettings,
      upsertZone,
      deleteZone,
      updateSchedule,
      isOpenNow
    }}>
      {children}
    </DeliveryContext.Provider>
  );
};
