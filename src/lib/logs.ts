/**
 * Logs service for storing and retrieving logs from PostgreSQL
 */

import { query } from "@/lib/database";
import { LogEntry } from "./logger";
import type { StoredLogEntry } from "./types/logs";

export type { StoredLogEntry };

export async function storeLog(logEntry: Omit<LogEntry, 'timestamp'>): Promise<void> {
  try {
    await query(
      `INSERT INTO logs (level, category, message, data, event_id, event_slug, user_agent, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        logEntry.level,
        logEntry.category,
        logEntry.message,
        logEntry.data ? JSON.stringify(logEntry.data) : null,
        logEntry.eventId || null,
        logEntry.eventSlug || null,
        logEntry.userAgent || null
      ]
    );
  } catch (error) {
    console.error("Failed to store log:", error);
    throw error; // Re-throw so we can see the error in the logger
  }
}

export async function getLogsForEvent(
  eventId: string, 
  limitCount: number = 100,
  category?: LogEntry['category']
): Promise<StoredLogEntry[]> {
  try {
    let queryText = `
      SELECT * FROM logs 
      WHERE event_id = $1 
      ${category ? 'AND category = $3' : ''}
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const params = category ? [eventId, limitCount, category] : [eventId, limitCount];
    const result = await query(queryText, params);
    
    return result.rows.map(row => ({
      id: row.id,
      timestamp: row.created_at,
      level: row.level,
      category: row.category,
      message: row.message,
      data: row.data ? JSON.parse(row.data) : undefined,
      eventId: row.event_id,
      eventSlug: row.event_slug,
      userAgent: row.user_agent,
      created_at: row.created_at
    }));
  } catch (error) {
    console.error("Failed to retrieve logs:", error);
    return [];
  }
}

export async function getRecentLogs(limitCount: number = 50): Promise<StoredLogEntry[]> {
  try {
    const result = await query(
      'SELECT * FROM logs ORDER BY created_at DESC LIMIT $1',
      [limitCount]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      timestamp: row.created_at,
      level: row.level,
      category: row.category,
      message: row.message,
      data: row.data ? JSON.parse(row.data) : undefined,
      eventId: row.event_id,
      eventSlug: row.event_slug,
      userAgent: row.user_agent,
      created_at: row.created_at
    }));
  } catch (error) {
    console.error("Failed to retrieve recent logs:", error);
    return [];
  }
}
