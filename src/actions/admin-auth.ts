"use server";

import { authenticateAdmin, createAdminSession, setAdminSessionCookie, clearAdminSessionCookie, validateAdminSession } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

export async function loginAdmin(username: string, password: string, eventId: string) {
  try {
    const result = await authenticateAdmin(username, password, eventId);
    
    if (result.success && result.user) {
      const sessionToken = await createAdminSession(result.user.id, eventId);
      await setAdminSessionCookie(sessionToken);
      
      revalidatePath(`/admin?eventSlug=${eventId}`);
      
      return { success: true };
    } else {
      return { success: false, error: result.error || "Authentication failed" };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Login failed" };
  }
}

export async function logoutAdmin() {
  try {
    await clearAdminSessionCookie();
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "Logout failed" };
  }
}

export async function checkAdminSession(eventId: string) {
  try {
    const { getAdminSessionCookie, validateAdminSession } = await import("@/lib/admin-auth");
    const sessionToken = await getAdminSessionCookie();
    
    if (!sessionToken) {
      return { authenticated: false };
    }
    
    const validation = await validateAdminSession(sessionToken, eventId);
    return { authenticated: validation.valid, userId: validation.userId };
  } catch (error) {
    console.error("Session check error:", error);
    return { authenticated: false };
  }
}

export async function checkAdminUsersExist(eventId: string) {
  try {
    const { db } = await import("@/lib/firebase");
    
    if (!db) {
      console.warn("Firebase not initialized, cannot check admin users");
      return { exists: false };
    }
    
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    
    const adminUsersRef = collection(db, "adminUsers");
    const q = query(adminUsersRef, where("eventId", "==", eventId));
    const querySnapshot = await getDocs(q);
    
    return { exists: !querySnapshot.empty };
  } catch (error) {
    console.error("Error checking admin users:", error);
    return { exists: false };
  }
}
