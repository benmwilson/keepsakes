
"use server";

import { query } from "@/lib/database";
import { Keepsake } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function addKeepsake(eventId: string, eventSlug: string, keepsakeData: Omit<Keepsake, "id" | "createdAt" | "eventId" | "pinned">) {
  try {
    // Log upload start
    await logger.guestUploadStarted(
      eventSlug, 
      eventId, 
      keepsakeData.type,
      keepsakeData.type === 'text' ? undefined : (keepsakeData.fileUrls?.[0] || keepsakeData.fileUrl)
    );

    const result = await query(
      `INSERT INTO keepsakes (event_id, type, file_url, file_urls, text, caption, name, pinned, hidden, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
       RETURNING id`,
      [
        eventId,
        keepsakeData.type,
        keepsakeData.fileUrl || null,
        keepsakeData.fileUrls || null,
        keepsakeData.text || null,
        keepsakeData.caption || null,
        keepsakeData.name || null,
        false, // pinned
        false  // hidden
      ]
    );

    const keepsakeId = result.rows[0].id;

    // Log successful upload
    await logger.guestUploadCompleted(
      eventSlug,
      eventId,
      keepsakeId,
      keepsakeData.type,
      keepsakeData.type === 'text' ? undefined : (keepsakeData.fileUrls?.[0] || keepsakeData.fileUrl)
    );

    revalidatePath(`/wall?eventSlug=${eventSlug}`);
    revalidatePath(`/admin?eventSlug=${eventSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding keepsake:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // Log failed upload
    await logger.guestUploadFailed(
      eventSlug,
      eventId,
      errorMessage,
      keepsakeData.type,
      keepsakeData.type === 'text' ? undefined : (keepsakeData.fileUrls?.[0] || keepsakeData.fileUrl)
    );
    
    return { success: false, error: errorMessage };
  }
}

export async function togglePinKeepsake(eventSlug: string, keepsakeId: string, pinned: boolean) {
    try {
        await query(
            'UPDATE keepsakes SET pinned = $1 WHERE id = $2',
            [!pinned, keepsakeId]
        );
        
        revalidatePath(`/wall?eventSlug=${eventSlug}`);
        revalidatePath(`/admin?eventSlug=${eventSlug}`);

        return { success: true };
    } catch (error) {
        console.error("Error pinning keepsake:", error);
        return { success: false, error: "Failed to pin keepsake." };
    }
}

export async function toggleHideKeepsake(eventSlug: string, keepsakeId: string, hidden: boolean) {
    try {
        await query(
            'UPDATE keepsakes SET hidden = $1 WHERE id = $2',
            [!hidden, keepsakeId]
        );
        
        revalidatePath(`/wall?eventSlug=${eventSlug}`);
        revalidatePath(`/admin?eventSlug=${eventSlug}`);

        return { success: true };
    } catch (error) {
        console.error("Error hiding keepsake:", error);
        return { success: false, error: "Failed to hide keepsake." };
    }
}

export async function deleteKeepsake(eventSlug: string, keepsakeId: string) {
    try {
        await query('DELETE FROM keepsakes WHERE id = $1', [keepsakeId]);

        revalidatePath(`/wall?eventSlug=${eventSlug}`);
        revalidatePath(`/admin?eventSlug=${eventSlug}`);
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting keepsake:", error);
        return { success: false, error: "Failed to delete keepsake." };
    }
}

export async function deleteGalleryItem(eventSlug: string, keepsakeId: string, itemIndex: number) {
    try {
        // Get the current keepsake to access its fileUrls
        const result = await query('SELECT file_urls FROM keepsakes WHERE id = $1', [keepsakeId]);
        if (result.rows.length === 0) {
            return { success: false, error: "Keepsake not found." };
        }
        
        const keepsakeData = result.rows[0];
        const fileUrls = keepsakeData.file_urls;
        
        if (!fileUrls || fileUrls.length <= 1) {
            // If only one item left, delete the entire keepsake
            await query('DELETE FROM keepsakes WHERE id = $1', [keepsakeId]);
        } else {
            // Remove the specific item from the array
            const updatedFileUrls = fileUrls.filter((_: any, index: number) => index !== itemIndex);
            await query('UPDATE keepsakes SET file_urls = $1 WHERE id = $2', [updatedFileUrls, keepsakeId]);
        }

        revalidatePath(`/wall?eventSlug=${eventSlug}`);
        revalidatePath(`/admin?eventSlug=${eventSlug}`);
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting gallery item:", error);
        return { success: false, error: "Failed to delete gallery item." };
    }
}
