
"use server";

import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function addGuestEmail(eventId: string, data: { email: string; name?: string; }) {
  if (!db) {
    console.warn("Firebase not initialized, cannot add guest email");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    await addDoc(collection(db, "guestEmails"), {
      eventId,
      email: data.email,
      name: data.name || '',
      hasConsented: true,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding guest email:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
