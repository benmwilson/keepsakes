"use server";

import { query } from '@/lib/database';
import { AUTH_CONFIG } from '@/lib/auth-config-constants';

// Site configuration functions
export const initializeSiteConfig = async (sitePassword: string) => {
  try {
    await query(
      'INSERT INTO app_config (key, value, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['site_password', sitePassword]
    );
    await query(
      'INSERT INTO app_config (key, value, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['password_protection_enabled', sitePassword ? 'true' : 'false']
    );
    console.log('Site config initialized with password protection:', !!sitePassword);
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize site config:', error);
    return { success: false, error: 'Failed to initialize site config' };
  }
};

export const getPasswordProtectionStatus = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT value FROM app_config WHERE key = $1', ['password_protection_enabled']);
    if (result.rows.length > 0) {
      return result.rows[0].value === 'true';
    }
  } catch (error) {
    console.warn('Failed to fetch password protection status from database, using fallback');
  }
  return !!AUTH_CONFIG.SITE_PASSWORD;
};

export const setPasswordProtectionStatus = async (enabled: boolean): Promise<{ success: boolean; error?: string }> => {
  try {
    await query(
      'INSERT INTO app_config (key, value, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['password_protection_enabled', enabled ? 'true' : 'false']
    );
    
    console.log('Password protection status set to:', enabled);
    return { success: true };
  } catch (error) {
    console.error('Failed to set password protection status:', error);
    return { success: false, error: 'Failed to update password protection status' };
  }
};

// Function to get password from database (more secure for production)
export const getSitePassword = async (): Promise<string> => {
  try {
    const result = await query('SELECT value FROM app_config WHERE key = $1', ['site_password']);
    if (result.rows.length > 0) {
      return result.rows[0].value || AUTH_CONFIG.SITE_PASSWORD;
    }
  } catch (error) {
    console.warn('Failed to fetch password from database, using fallback');
  }
  return AUTH_CONFIG.SITE_PASSWORD;
};

export const setSitePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await query(
      'INSERT INTO app_config (key, value, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['site_password', password]
    );
    await query(
      'INSERT INTO app_config (key, value, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['password_protection_enabled', password ? 'true' : 'false']
    );
    
    console.log('Site password updated, protection enabled:', !!password);
    return { success: true };
  } catch (error) {
    console.error('Failed to set site password:', error);
    return { success: false, error: 'Failed to update site password' };
  }
};
