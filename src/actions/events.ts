
"use server";

import { query } from "@/lib/database";
import type { Event } from "@/lib/types";
import { revalidatePath } from "next/cache";

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

export async function updateEvent(eventId: string, currentSlug: string, data: Partial<Omit<Event, 'id' | 'createdAt'>>) {
    try {
        // Check if slug is being updated and validate uniqueness
        if (data.slug && data.slug !== currentSlug) {
            const existingEvent = await query('SELECT id FROM events WHERE slug = $1 AND id != $2', [data.slug, eventId]);
            if (existingEvent.rows.length > 0) {
                return { success: false, error: "Event slug already exists." };
            }
        }

        // Build dynamic update query
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                // Convert camelCase to snake_case for database
                const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                updateFields.push(`${dbKey} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        });

        if (updateFields.length === 0) {
            return { success: true };
        }

        values.push(eventId);
        const updateQuery = `UPDATE events SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
        
        await query(updateQuery, values);
        
        // Revalidate all paths to ensure they use the updated slug
        revalidatePath('/');
        revalidatePath('/admin');
        revalidatePath('/upload');
        revalidatePath('/wall');
        revalidatePath('/thanks');
        
        return { success: true, newSlug: data.slug };
    } catch (error) {
        console.error("Error updating event:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return { success: false, error: errorMessage };
    }
}

export async function toggleEventPause(eventId: string, slug: string, paused: boolean) {
    try {
        await query('UPDATE events SET paused = $1 WHERE id = $2', [paused, eventId]);
        revalidatePath(`/admin?eventSlug=${slug}`);
        revalidatePath(`/wall?eventSlug=${slug}`);
    } catch (error) {
        console.error("Error toggling event pause:", error);
    }
}

export async function skipNext(eventId: string, slug: string) {
    try {
        await query('UPDATE events SET skip_next = true WHERE id = $1', [eventId]);
        revalidatePath(`/wall?eventSlug=${slug}`);
    } catch (error) {
        console.error("Error skipping next:", error);
    }
}

export async function skipPrev(eventId: string, slug: string) {
    try {
        await query('UPDATE events SET skip_prev = true WHERE id = $1', [eventId]);
        revalidatePath(`/wall?eventSlug=${slug}`);
    } catch (error) {
        console.error("Error skipping previous:", error);
    }
}

export async function restartAutoplay(eventId: string, slug: string) {
    try {
        await query('UPDATE events SET restart_autoplay = NOW() WHERE id = $1', [eventId]);
        revalidatePath(`/wall?eventSlug=${slug}`);
    } catch (error) {
        console.error("Error restarting autoplay:", error);
    }
}
    
