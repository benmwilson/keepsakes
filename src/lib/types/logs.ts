import { LogEntry } from "../logger";

export interface StoredLogEntry extends LogEntry {
  id: string;
  created_at: string; // PostgreSQL timestamp
}
