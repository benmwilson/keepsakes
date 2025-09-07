
"use server";

import { query } from "@/lib/database";
import type { Event } from "@/lib/types";
import { revalidatePath } from "next/cache";

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
    
