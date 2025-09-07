"use server";

import { getLogsForEvent, getRecentLogs, StoredLogEntry } from "@/lib/logs";

export async function fetchLogsForEvent(
  eventId: string, 
  limitCount: number = 100,
  category?: string
): Promise<StoredLogEntry[]> {
  return await getLogsForEvent(eventId, limitCount, category as any);
}

export async function fetchRecentLogs(limitCount: number = 50): Promise<StoredLogEntry[]> {
  return await getRecentLogs(limitCount);
}
