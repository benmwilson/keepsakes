"use server";

import { query } from "@/lib/database";
import { revalidatePath } from "next/cache";

export async function createAdminUser(username: string, password: string, eventId: string) {
  try {
    // Check if admin users already exist for this event
    const existingUsers = await query('SELECT id FROM admin_users WHERE event_id = $1', [eventId]);
    
    if (existingUsers.rows.length > 0) {
      return { success: false, error: "Admin user already exists for this event" };
    }

    // Create admin user (password should be hashed in production)
    const result = await query(
      'INSERT INTO admin_users (username, password_hash, event_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [username, password, eventId]
    );
    
    revalidatePath(`/admin?eventSlug=${eventId}`);
    
    return { success: true, userId: result.rows[0].id };
  } catch (error) {
    console.error("Error creating admin user:", error);
    return { success: false, error: "Failed to create admin user" };
  }
}
