"use server";

import { query } from "@/lib/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function resetToDefault(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get a client from the pool for transaction management
    const { getClient } = await import('@/lib/database');
    const client = await getClient();
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Drop all tables in the correct order (respecting foreign key constraints)
      await client.query('DROP TABLE IF EXISTS logs CASCADE');
      await client.query('DROP TABLE IF EXISTS memories CASCADE');
      await client.query('DROP TABLE IF EXISTS guests CASCADE');
      await client.query('DROP TABLE IF EXISTS admin_users CASCADE');
      await client.query('DROP TABLE IF EXISTS events CASCADE');
      await client.query('DROP TABLE IF EXISTS app_config CASCADE');
      
      // Recreate the database schema from scratch
      await client.query(`
        CREATE TABLE IF NOT EXISTS app_config (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          slug VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          subtitle VARCHAR(500),
          hero_image_url TEXT,
          hero_color VARCHAR(7),
          instructions TEXT,
          consent_required BOOLEAN DEFAULT false,
          paused BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          skip_next BOOLEAN DEFAULT false,
          skip_prev BOOLEAN DEFAULT false,
          autoplay_delay INTEGER DEFAULT 5000,
          transition_duration INTEGER DEFAULT 1000,
          gallery_transition_duration INTEGER DEFAULT 500,
          gallery_item_delay INTEGER DEFAULT 200,
          restart_autoplay TIMESTAMP,
          allow_downloads BOOLEAN DEFAULT true,
          enabled_keepsake_types JSONB DEFAULT '{"photo": true, "video": true, "text": true, "gallery": true}',
          show_captions BOOLEAN DEFAULT true,
          show_author_names BOOLEAN DEFAULT true,
          enable_fullscreen BOOLEAN DEFAULT true,
          mobile_grid_columns INTEGER DEFAULT 2,
          gallery_size_limit INTEGER DEFAULT 50,
          email_registration_enabled BOOLEAN DEFAULT false
        );
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
          username VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(event_id, username)
        );
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS guests (
          id SERIAL PRIMARY KEY,
          event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
          email VARCHAR(255),
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS memories (
          id SERIAL PRIMARY KEY,
          event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          content TEXT,
          file_path VARCHAR(500),
          file_name VARCHAR(255),
          file_size INTEGER,
          file_type VARCHAR(100),
          author_name VARCHAR(255),
          author_email VARCHAR(255),
          caption TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          approved BOOLEAN DEFAULT true
        );
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          level VARCHAR(20) NOT NULL,
          category VARCHAR(100),
          message TEXT NOT NULL,
          data JSONB,
          event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
          event_slug VARCHAR(255),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log('Database reset to default state successfully');
      
      // Revalidate all paths to clear any cached data
      revalidatePath('/', 'layout');
      revalidatePath('/admin');
      revalidatePath('/upload');
      revalidatePath('/wall');
      revalidatePath('/setup');
      
      return { success: true };
      
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Always release the client back to the pool
      client.release();
    }
    
  } catch (error) {
    console.error('Error resetting database to default:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
