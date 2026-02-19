import { supabase } from '@/services/supabaseClient';
import { AppSettings } from '@/types';
import { logger } from '@/services/logger';

export const DEFAULT_SETTINGS: AppSettings = {
  store_name: 'Yalla Wasel',
  store_description: 'Luxury Kit Delivery Service',
  logo_url: '',
  contact_email: 'support@yallawasel.com',
  contact_phone: '',
  maintenance_mode: false,
  maintenance_message: 'We are currently upgrading our luxury experience. We will be back shortly.',
  language: 'en',
  currency: 'USD',
  currency_symbol: '$',
  timezone: 'Asia/Beirut',
  theme: 'light',
  enable_2fa: false,
  session_timeout_minutes: 60,
  tax_rate: 11,
  tax_inclusive: true,
  enable_stripe: false,
  enable_cod: true,
  ticker_speed: 40
};

export const SettingsService = {
  /**
   * Fetches the singleton settings row (ID=1).
   * Merges explicit columns with the `config` JSONB column to provide a unified object.
   */
  async getSettings(): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      logger.warn(`SettingsService: Could not fetch settings, using defaults. ${error.message}`);
      return DEFAULT_SETTINGS;
    }

    // Merge logic: Config JSON takes precedence for extended fields, 
    // but specific columns override config if they exist to keep DB consistent.
    const config = data.config || {};

    return {
      ...DEFAULT_SETTINGS,
      ...config, // Spread JSON config first
      // Override with strongly typed columns if they exist in the DB response
      store_name: data.store_name ?? config.store_name ?? DEFAULT_SETTINGS.store_name,
      store_description: data.store_description ?? config.store_description ?? DEFAULT_SETTINGS.store_description,
      logo_url: data.logo_url ?? config.logo_url ?? DEFAULT_SETTINGS.logo_url,
      contact_email: data.contact_email ?? config.contact_email ?? DEFAULT_SETTINGS.contact_email,
      contact_phone: data.contact_phone ?? config.contact_phone ?? DEFAULT_SETTINGS.contact_phone,
      maintenance_mode: data.maintenance_mode ?? config.maintenance_mode ?? DEFAULT_SETTINGS.maintenance_mode,
      ticker_speed: config.ticker_speed ?? DEFAULT_SETTINGS.ticker_speed,
    };
  },

  /**
   * Updates the singleton settings row.
   * Persists core fields to their specific columns AND persists the entire object to `config` JSON.
   */
  async updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
    // 1. Get current to merge
    const current = await this.getSettings();
    const merged = { ...current, ...newSettings };

    // 2. Separate Core Columns vs JSON Config
    // We duplicate core fields into `config` to ensure `config` is always a complete snapshot.
    const payload = {
      id: 1, // Enforce Singleton
      store_name: merged.store_name,
      store_description: merged.store_description,
      logo_url: merged.logo_url,
      contact_email: merged.contact_email,
      contact_phone: merged.contact_phone,
      maintenance_mode: merged.maintenance_mode,
      ticker_speed: merged.ticker_speed,
      config: merged // Store EVERYTHING in JSON for future-proofing
    };

    const { error } = await supabase
      .from('app_settings')
      .upsert(payload);

    if (error) {
      throw new Error(`Failed to save settings: ${error.message}`);
    }

    // Log the action
    await supabase.from('admin_logs').insert({
      action: 'Updated Global Settings',
      admin_name: 'System/Admin',
      type: 'warning'
    });
  }
};
