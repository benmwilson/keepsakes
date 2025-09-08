
import { query } from "@/lib/database";
import type { Event } from "./types";
import { APP_CONFIG } from "./config";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with -
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing dashes
}


export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const result = await query('SELECT * FROM events WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return null;
    }
    
    const eventData = result.rows[0];
    return {
      id: eventData.id,
      slug: eventData.slug,
      name: eventData.name,
      subtitle: eventData.subtitle,
      heroImageUrl: eventData.hero_image_url,
      heroColor: eventData.hero_color,
      instructions: eventData.instructions,
      consentRequired: eventData.consent_required,
      paused: eventData.paused,
      createdAt: eventData.created_at,
      skipNext: eventData.skip_next,
      skipPrev: eventData.skip_prev,
      autoplayDelay: eventData.autoplay_delay,
      transitionDuration: eventData.transition_duration,
      galleryTransitionDuration: eventData.gallery_transition_duration,
      galleryItemDelay: eventData.gallery_item_delay,
      restartAutoplay: eventData.restart_autoplay,
      allowDownloads: eventData.allow_downloads,
      enabledKeepsakeTypes: eventData.enabled_keepsake_types,
      showCaptions: eventData.show_captions,
      showAuthorNames: eventData.show_author_names,
      enableFullscreen: eventData.enable_fullscreen,
      mobileGridColumns: eventData.mobile_grid_columns,
      gallerySizeLimit: eventData.gallery_size_limit,
      emailRegistrationEnabled: eventData.email_registration_enabled,
      galleryEnabled: true // TODO: Add this field to database schema
    } as Event;
  } catch (error) {
    console.error("Error fetching event by slug:", error);
    return null;
  }
}

// Get the single event (for single-event apps)
export async function getSingleEvent(): Promise<Event | null> {
  try {
    const result = await query('SELECT * FROM events LIMIT 1');
    if (result.rows.length === 0) {
      return null;
    }
    
    const eventData = result.rows[0];
    return {
      id: eventData.id,
      slug: eventData.slug,
      name: eventData.name,
      subtitle: eventData.subtitle,
      heroImageUrl: eventData.hero_image_url,
      heroColor: eventData.hero_color,
      instructions: eventData.instructions,
      consentRequired: eventData.consent_required,
      paused: eventData.paused,
      createdAt: eventData.created_at,
      skipNext: eventData.skip_next,
      skipPrev: eventData.skip_prev,
      autoplayDelay: eventData.autoplay_delay,
      transitionDuration: eventData.transition_duration,
      galleryTransitionDuration: eventData.gallery_transition_duration,
      galleryItemDelay: eventData.gallery_item_delay,
      restartAutoplay: eventData.restart_autoplay,
      allowDownloads: eventData.allow_downloads,
      enabledKeepsakeTypes: eventData.enabled_keepsake_types,
      showCaptions: eventData.show_captions,
      showAuthorNames: eventData.show_author_names,
      enableFullscreen: eventData.enable_fullscreen,
      mobileGridColumns: eventData.mobile_grid_columns,
      gallerySizeLimit: eventData.gallery_size_limit,
      emailRegistrationEnabled: eventData.email_registration_enabled,
      galleryEnabled: true // TODO: Add this field to database schema
    } as Event;
  } catch (error) {
    console.error("Error fetching single event:", error);
    return null;
  }
}
