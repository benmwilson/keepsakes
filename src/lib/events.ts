
// TODO: Replace Firebase imports with Postgres database connection
// import { query } from "@/lib/database";
import type { Event } from "./types";
import { APP_CONFIG } from "./config";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with -
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing dashes
}


export async function getEventBySlug(slug: string): Promise<Event | null> {
  // TODO: Replace with Postgres database query
  // SELECT * FROM events WHERE slug = $1
  
  if (!slug) return null;
  
  // Mock implementation for testing - return default event
  if (slug === APP_CONFIG.DEFAULT_EVENT_SLUG) {
    return {
      id: "mock-event-id",
      slug: slug,
      ...APP_CONFIG.DEFAULT_EVENT,
      createdAt: new Date(),
    } as Event;
  }
  
  return null;
}

// Get the single event (for single-event apps)
export async function getSingleEvent(): Promise<Event | null> {
  // TODO: Replace with Postgres database query
  // SELECT * FROM events LIMIT 1
  
  // Mock implementation for testing - return default event
  return {
    id: "mock-event-id",
    slug: APP_CONFIG.DEFAULT_EVENT_SLUG,
    ...APP_CONFIG.DEFAULT_EVENT,
    createdAt: new Date(),
  } as Event;
}
