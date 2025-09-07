/**
 * Client-side logger that doesn't import database dependencies
 * This is a simplified version that only logs to console
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'upload' | 'guest' | 'admin' | 'system';
  message: string;
  data?: Record<string, any>;
  eventId?: string;
  eventSlug?: string;
  userAgent?: string;
  ip?: string;
}

// Deduplication cache to prevent duplicate logs in React strict mode
const loggedEvents = new Set<string>();

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, category, message, data, eventSlug } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]`;
    const eventInfo = eventSlug ? ` [${eventSlug}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${prefix}${eventInfo} ${message}${dataStr}`;
  }

  private createLogEntry(
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    data?: Record<string, any>,
    eventId?: string,
    eventSlug?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      eventId,
      eventSlug,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Client',
    };
  }

  private async log(entry: LogEntry): Promise<void> {
    const formattedMessage = this.formatLogEntry(entry);

    // Always log to console in development
    if (this.isDevelopment) {
      switch (entry.level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }

    // In production, you could send logs to a service like Sentry, LogRocket, etc.
    if (!this.isDevelopment && entry.level === 'error') {
      console.error(formattedMessage);
    }

    // For client-side logging, we'll just use console logging
    // Server-side logging will handle database storage
  }

  // Helper method to prevent duplicate logs
  private shouldLog(eventKey: string): boolean {
    if (loggedEvents.has(eventKey)) {
      return false;
    }
    loggedEvents.add(eventKey);
    // Clean up old entries after 5 minutes to prevent memory leaks
    setTimeout(() => {
      loggedEvents.delete(eventKey);
    }, 5 * 60 * 1000);
    return true;
  }

  // Guest upload logging methods
  async guestUploadStarted(eventSlug: string, eventId: string, fileType: string, fileName?: string): Promise<void> {
    const eventKey = `upload_start_${eventId}_${Date.now()}`;
    if (!this.shouldLog(eventKey)) {
      console.log('🚫 Duplicate upload start log prevented');
      return;
    }
    
    await this.log(this.createLogEntry(
      'info',
      'upload',
      'Guest upload started',
      { fileType, fileName },
      eventId,
      eventSlug
    ));
  }

  async guestUploadCompleted(eventSlug: string, eventId: string, keepsakeId: string, fileType: string, fileName?: string): Promise<void> {
    const eventKey = `upload_complete_${keepsakeId}`;
    if (!this.shouldLog(eventKey)) {
      console.log('🚫 Duplicate upload complete log prevented');
      return;
    }
    
    await this.log(this.createLogEntry(
      'info',
      'upload',
      'Guest upload completed successfully',
      { keepsakeId, fileType, fileName },
      eventId,
      eventSlug
    ));
  }

  async guestUploadFailed(eventSlug: string, eventId: string, error: string, fileType?: string, fileName?: string): Promise<void> {
    const eventKey = `upload_failed_${eventId}_${Date.now()}`;
    if (!this.shouldLog(eventKey)) {
      console.log('🚫 Duplicate upload failed log prevented');
      return;
    }
    
    await this.log(this.createLogEntry(
      'error',
      'upload',
      'Guest upload failed',
      { error, fileType, fileName },
      eventId,
      eventSlug
    ));
  }

  async guestConsentGiven(eventSlug: string, eventId: string, guestName?: string, guestEmail?: string): Promise<void> {
    const eventKey = `consent_${eventId}_${guestName || 'anonymous'}`;
    if (!this.shouldLog(eventKey)) {
      console.log('🚫 Duplicate consent log prevented');
      return;
    }
    
    await this.log(this.createLogEntry(
      'info',
      'guest',
      'Guest consent given',
      { guestName, guestEmail },
      eventId,
      eventSlug
    ));
  }

  async guestVisitedUploadPage(eventSlug: string, eventId: string): Promise<void> {
    const eventKey = `visit_upload_${eventId}`;
    if (!this.shouldLog(eventKey)) {
      console.log('🚫 Duplicate upload page visit log prevented');
      return;
    }
    
    await this.log(this.createLogEntry(
      'info',
      'guest',
      'Guest visited upload page',
      undefined,
      eventId,
      eventSlug
    ));
  }

  async guestVisitedWall(eventSlug: string, eventId: string, viewMode?: 'grid' | 'swipe'): Promise<void> {
    const eventKey = `visit_wall_${eventId}_${viewMode || 'unknown'}`;
    if (!this.shouldLog(eventKey)) {
      console.log('🚫 Duplicate wall visit log prevented');
      return;
    }
    
    await this.log(this.createLogEntry(
      'info',
      'guest',
      'Guest visited memory wall',
      { viewMode },
      eventId,
      eventSlug
    ));
  }

  // Generic logging methods
  async info(category: LogEntry['category'], message: string, data?: Record<string, any>, eventSlug?: string, eventId?: string): Promise<void> {
    await this.log(this.createLogEntry('info', category, message, data, eventId, eventSlug));
  }

  async warn(category: LogEntry['category'], message: string, data?: Record<string, any>, eventSlug?: string, eventId?: string): Promise<void> {
    await this.log(this.createLogEntry('warn', category, message, data, eventId, eventSlug));
  }

  async error(category: LogEntry['category'], message: string, data?: Record<string, any>, eventSlug?: string, eventId?: string): Promise<void> {
    await this.log(this.createLogEntry('error', category, message, data, eventId, eventSlug));
  }

  async debug(category: LogEntry['category'], message: string, data?: Record<string, any>, eventSlug?: string, eventId?: string): Promise<void> {
    await this.log(this.createLogEntry('debug', category, message, data, eventId, eventSlug));
  }
}

export const clientLogger = new ClientLogger();
