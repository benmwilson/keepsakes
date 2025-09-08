"use server";

import { query } from "@/lib/database";
import { createAdminUser } from "@/actions/admin-users";
import { initializeSiteConfig } from "@/actions/auth-config";
import { revalidatePath } from "next/cache";

import type { SetupData } from "@/lib/types/setup";


export async function isFirstTimeSetup(): Promise<boolean> {
  try {
    // Check if any events exist
    const eventsResult = await query('SELECT COUNT(*) as count FROM events');
    const eventCount = parseInt(eventsResult.rows[0].count);
    
    // Check if any admin users exist
    const adminResult = await query('SELECT COUNT(*) as count FROM admin_users');
    const adminCount = parseInt(adminResult.rows[0].count);
    
    // First time setup if no events AND no admin users
    return eventCount === 0 && adminCount === 0;
  } catch (error) {
    console.error("Error checking setup status:", error);
    // If there's an error, assume it's first time setup
    return true;
  }
}

export async function completeFirstTimeSetup(setupData: SetupData): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the event
    const eventResult = await query(
      `INSERT INTO events (
        slug, name, subtitle, instructions, 
        consent_required, paused, autoplay_delay, gallery_item_delay, 
        gallery_transition_duration, allow_downloads, enabled_keepsake_types,
        show_captions, show_author_names, enable_fullscreen, mobile_grid_columns,
        gallery_size_limit, email_registration_enabled, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()) 
      RETURNING id`,
      [
        setupData.eventSlug,
        setupData.eventName,
        setupData.eventSubtitle || null,
        setupData.eventInstructions || null,
        setupData.consentRequired,
        false, // paused
        setupData.autoplayDelay,
        setupData.galleryItemDelay,
        setupData.galleryTransitionDuration,
        setupData.allowDownloads,
        JSON.stringify(setupData.enabledKeepsakeTypes),
        setupData.showCaptions,
        setupData.showAuthorNames,
        setupData.enableFullscreen,
        setupData.mobileGridColumns,
        setupData.gallerySizeLimit,
        setupData.emailRegistrationEnabled
      ]
    );
    
    const eventId = eventResult.rows[0].id;
    
    // Initialize site configuration if password protection is enabled
    if (setupData.enablePasswordProtection && setupData.sitePassword) {
      await initializeSiteConfig(setupData.sitePassword);
    }
    
    // Create admin user
    const adminResult = await createAdminUser(
      setupData.adminUsername,
      setupData.adminPassword,
      eventId
    );
    
    if (!adminResult.success) {
      return { success: false, error: adminResult.error || "Failed to create admin user" };
    }
    
    // Store Google Analytics configuration in environment or database
    // For now, we'll store it in a simple config table
    if (setupData.enableGoogleAnalytics && setupData.googleAnalyticsId) {
      await query(
        'INSERT INTO app_config (key, value, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2',
        ['google_analytics_id', setupData.googleAnalyticsId]
      );
    }
    
    // Revalidate all paths
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/wall');
    revalidatePath('/upload');
    
    return { success: true };
  } catch (error) {
    console.error("Error completing first time setup:", error);
    return { success: false, error: "Failed to complete setup. Please try again." };
  }
}

export async function getGoogleAnalyticsId(): Promise<string | null> {
  try {
    const result = await query('SELECT value FROM app_config WHERE key = $1', ['google_analytics_id']);
    return result.rows.length > 0 ? result.rows[0].value : null;
  } catch (error) {
    console.error("Error getting Google Analytics ID:", error);
    return null;
  }
}
