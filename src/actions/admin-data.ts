"use server";

import { query } from "@/lib/database";
import type { Keepsake, Event } from "@/lib/types";

export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const result = await query('SELECT * FROM events WHERE id = $1', [eventId]);
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
    console.error("Error fetching event:", error);
    return null;
  }
}

export async function getAllKeepsakesByEventId(eventId: string): Promise<Keepsake[]> {
  try {
    const result = await query(
      'SELECT * FROM keepsakes WHERE event_id = $1 ORDER BY pinned DESC, created_at DESC',
      [eventId]
    );
    
    return result.rows.map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      type: row.type,
      fileUrl: row.file_url,
      fileUrls: row.file_urls,
      text: row.text,
      caption: row.caption,
      name: row.name,
      createdAt: row.created_at,
      pinned: row.pinned,
      hidden: row.hidden
    }));
  } catch (error) {
    console.error("Error fetching keepsakes:", error);
    return [];
  }
}
