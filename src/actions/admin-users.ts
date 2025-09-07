"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";

export async function createAdminUser(username: string, password: string, eventId: string) {
  if (!db) {
    console.warn("Firebase not initialized, cannot create admin user");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    // Check if admin users already exist for this event
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    const adminUsersRef = collection(db, "adminUsers");
    const q = query(adminUsersRef, where("eventId", "==", eventId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, error: "Admin user already exists for this event" };
    }

    const adminUser = {
      username: username,
      password: password, // In production, this should be hashed
      eventId: eventId,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "adminUsers"), adminUser);
    
    revalidatePath(`/admin?eventSlug=${eventId}`);
    
    return { success: true, userId: docRef.id };
  } catch (error) {
    console.error("Error creating admin user:", error);
    return { success: false, error: "Failed to create admin user" };
  }
}
