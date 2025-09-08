import { query } from "./database";
import { cookies } from "next/headers";

export interface AdminUser {
  id: string;
  username: string;
  password: string; // In production, this should be hashed
  eventId: string;
  createdAt: Date;
}

// Session management
const SESSION_COOKIE_NAME = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function authenticateAdmin(username: string, password: string, eventId: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const result = await query(
      'SELECT * FROM admin_users WHERE username = $1 AND event_id = $2',
      [username, eventId]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: "Invalid credentials" };
    }
    
    const adminData = result.rows[0];
    
    if (adminData.password === password) {
      return { 
        success: true, 
        user: { 
          id: adminData.id,
          username: adminData.username,
          password: adminData.password,
          eventId: adminData.event_id,
          createdAt: adminData.created_at
        } 
      };
    } else {
      return { success: false, error: "Invalid credentials" };
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

export async function createAdminSession(userId: string, eventId: string): Promise<string> {
  const sessionData = {
    userId,
    eventId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };
  
  // In a real app, you'd store this in a sessions collection
  // For now, we'll use a simple JWT-like approach
  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  
  return sessionToken;
}

export async function validateAdminSession(sessionToken: string, eventId: string): Promise<{ valid: boolean; userId?: string }> {
  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    
    if (sessionData.expiresAt < Date.now()) {
      return { valid: false };
    }
    
    if (sessionData.eventId !== eventId) {
      return { valid: false };
    }
    
    return { valid: true, userId: sessionData.userId };
  } catch (error) {
    return { valid: false };
  }
}

// Server-side cookie helpers
export async function setAdminSessionCookie(sessionToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/'
  });
}

export async function getAdminSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
