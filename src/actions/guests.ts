
"use server";

import { query } from "@/lib/database";

export async function addGuestEmail(eventId: string, data: { email: string; name?: string; }) {
  try {
    await query(
      'INSERT INTO guest_emails (event_id, email, name, has_consented, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [eventId, data.email, data.name || '', true]
    );
    return { success: true };
  } catch (error) {
    console.error("Error adding guest email:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
