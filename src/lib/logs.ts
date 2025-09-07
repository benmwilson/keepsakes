/**
 * Logs service for storing and retrieving logs from Firestore
 */

// TODO: Replace Firebase imports with Postgres database connection
// import { query } from "@/lib/database";
import { LogEntry } from "./logger";

export interface StoredLogEntry extends LogEntry {
  id: string;
  createdAt: any; // Firestore timestamp
}

export async function storeLog(logEntry: Omit<LogEntry, 'timestamp'>): Promise<void> {
  if (!db) {
    console.warn("Firebase not initialized, skipping log storage");
    return;
  }

  try {
    await addDoc(collection(db, "logs"), {
      ...logEntry,
      createdAt: serverTimestamp(),
    });
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
  if (!db) {
    console.warn("Firebase not initialized, returning empty logs");
    return [];
  }

  try {
    // Start with a simple query that doesn't require composite indexes
    let q = query(
      collection(db, "logs"),
      where("eventId", "==", eventId),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const logs: StoredLogEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      } as StoredLogEntry);
    });

    // Sort in memory instead of using orderBy in the query
    logs.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime; // Descending order
    });

    // Filter by category in memory if needed
    const filteredLogs = category ? logs.filter(log => log.category === category) : logs;

    return filteredLogs;
  } catch (error) {
    console.error("Failed to retrieve logs:", error);
    return [];
  }
}

export async function getRecentLogs(limitCount: number = 50): Promise<StoredLogEntry[]> {
  if (!db) {
    console.warn("Firebase not initialized, returning empty logs");
    return [];
  }

  try {
    // Simple query without orderBy to avoid index requirements
    const q = query(
      collection(db, "logs"),
      limit(limitCount * 2) // Get more than needed since we'll sort in memory
    );

    const querySnapshot = await getDocs(q);
    const logs: StoredLogEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      } as StoredLogEntry);
    });

    // Sort in memory by createdAt descending
    logs.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime; // Descending order
    });

    // Return only the requested limit
    return logs.slice(0, limitCount);
  } catch (error) {
    console.error("Failed to retrieve recent logs:", error);
    return [];
  }
}
