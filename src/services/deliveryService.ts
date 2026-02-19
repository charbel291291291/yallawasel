
import { supabase } from './supabaseClient';
import { DeliveryConfig, DeliverySettings, DeliveryZone, DeliveryDay } from '../types';

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  enabled: true,
  free_delivery_enabled: true,
  free_delivery_min_order: 50,
  default_fee: 5,
  estimated_time_min: 30,
  estimated_time_max: 60
};

export const DeliveryService = {
  /**
   * Fetch complete delivery configuration
   */
  async getConfig(): Promise<DeliveryConfig> {
    // 1. Fetch Settings
    const { data: settingsData } = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('id', 1)
      .single();

    // 2. Fetch Zones
    const { data: zonesData } = await supabase
      .from('delivery_zones')
      .select('*')
      .order('name');

    // 3. Fetch Schedule
    const { data: scheduleData } = await supabase
      .from('delivery_schedule')
      .select('*')
      .order('day_of_week');

    return {
      settings: settingsData || DEFAULT_DELIVERY_SETTINGS,
      zones: zonesData || [],
      schedule: scheduleData || []
    };
  },

  /**
   * Update singleton settings
   */
  async updateSettings(settings: Partial<DeliverySettings>): Promise<void> {
    const { error } = await supabase
      .from('delivery_settings')
      .upsert({ id: 1, ...settings });
    
    if (error) throw new Error(error.message);
  },

  /**
   * Upsert a delivery zone
   */
  async upsertZone(zone: Partial<DeliveryZone>): Promise<void> {
    // If it's a new zone (no ID), exclude ID from payload so DB generates it (or handle UUID on client)
    const payload = { ...zone };
    if (!payload.id) delete payload.id;

    const { error } = await supabase
      .from('delivery_zones')
      .upsert(payload);
    
    if (error) throw new Error(error.message);
  },

  /**
   * Delete a zone
   */
  async deleteZone(id: string): Promise<void> {
    const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  /**
   * Update schedule for a specific day
   */
  async updateSchedule(day: DeliveryDay): Promise<void> {
    const { error } = await supabase
      .from('delivery_schedule')
      .upsert(day);
    
    if (error) throw new Error(error.message);
  },

  /**
   * Calculate Fee Logic
   */
  calculateFee(
    subtotal: number,
    settings: DeliverySettings,
    selectedZone?: DeliveryZone | null
  ): { fee: number; isFree: boolean; reason?: string } {
    
    // 1. Check if Delivery is Enabled Globaly
    if (!settings.enabled) {
      return { fee: 0, isFree: false, reason: 'Delivery Unavailable' };
    }

    // 2. Determine Base Fee (Zone specific or Default)
    let fee = selectedZone ? selectedZone.fee : settings.default_fee;

    // 3. Check Free Delivery Rules
    // Zone specific rules typically override global rules, or we apply global rule to the zone fee?
    // Implementation: Global free shipping applies to final calculated fee
    if (settings.free_delivery_enabled && subtotal >= settings.free_delivery_min_order) {
      return { fee: 0, isFree: true, reason: 'Free Delivery Applied' };
    }

    return { fee, isFree: false };
  }
};
