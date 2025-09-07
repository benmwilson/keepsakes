
"use server";

import { db } from "@/lib/firebase";
import { Keepsake } from "@/lib/types";
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function addKeepsake(eventId: string, eventSlug: string, keepsakeData: Omit<Keepsake, "id" | "createdAt" | "eventId" | "pinned">) {
  if (!db) {
    console.warn("Firebase not initialized, cannot add keepsake");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    // Log upload start
    await logger.guestUploadStarted(
      eventSlug, 
      eventId, 
      keepsakeData.type,
      keepsakeData.type === 'text' ? undefined : (keepsakeData.fileUrls?.[0] || keepsakeData.fileUrl)
    );

    const docRef = await addDoc(collection(db, "keepsakes"), {
      ...keepsakeData,
      eventId,
      pinned: false,
      createdAt: serverTimestamp(),
    });

    // Log successful upload
    await logger.guestUploadCompleted(
      eventSlug,
      eventId,
      docRef.id,
      keepsakeData.type,
      keepsakeData.type === 'text' ? undefined : (keepsakeData.fileUrls?.[0] || keepsakeData.fileUrl)
    );

    revalidatePath(`/wall?eventSlug=${eventSlug}`);
    revalidatePath(`/admin?eventSlug=${eventSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding keepsake:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // Log failed upload
    await logger.guestUploadFailed(
      eventSlug,
      eventId,
      errorMessage,
      keepsakeData.type,
      keepsakeData.type === 'text' ? undefined : (keepsakeData.fileUrls?.[0] || keepsakeData.fileUrl)
    );
    
    return { success: false, error: errorMessage };
  }
}

export async function togglePinKeepsake(eventSlug: string, keepsakeId: string, pinned: boolean) {
    if (!db) {
      console.warn("Firebase not initialized, cannot toggle pin");
      return { success: false, error: "Firebase not initialized" };
    }

    try {
        const keepsakeRef = doc(db, 'keepsakes', keepsakeId);
        await updateDoc(keepsakeRef, { pinned: !pinned });
        
        revalidatePath(`/wall?eventSlug=${eventSlug}`);
        revalidatePath(`/admin?eventSlug=${eventSlug}`);

        return { success: true };
    } catch (error) {
        console.error("Error pinning keepsake:", error);
        return { success: false, error: "Failed to pin keepsake." };
    }
}

export async function toggleHideKeepsake(eventSlug: string, keepsakeId: string, hidden: boolean) {
    if (!db) {
      console.warn("Firebase not initialized, cannot toggle hide");
      return { success: false, error: "Firebase not initialized" };
    }

    try {
        const keepsakeRef = doc(db, 'keepsakes', keepsakeId);
        await updateDoc(keepsakeRef, { hidden: !hidden });
        
        revalidatePath(`/wall?eventSlug=${eventSlug}`);
        revalidatePath(`/admin?eventSlug=${eventSlug}`);

        return { success: true };
    } catch (error) {
        console.error("Error hiding keepsake:", error);
        return { success: false, error: "Failed to hide keepsake." };
    }
}

export async function deleteKeepsake(eventSlug: string, keepsakeId: string) {
    if (!db) {
      console.warn("Firebase not initialized, cannot delete keepsake");
      return { success: false, error: "Firebase not initialized" };
    }

    try {
        const keepsakeRef = doc(db, 'keepsakes', keepsakeId);
        await deleteDoc(keepsakeRef);

        revalidatePath(`/wall?eventSlug=${eventSlug}`);
        revalidatePath(`/admin?eventSlug=${eventSlug}`);
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting keepsake:", error);
        return { success: false, error: "Failed to delete keepsake." };
    }
}

export async function deleteGalleryItem(eventSlug: string, keepsakeId: string, itemIndex: number) {
    if (!db) {
      console.warn("Firebase not initialized, cannot delete gallery item");
      return { success: false, error: "Firebase not initialized" };
    }

    try {
        const keepsakeRef = doc(db, 'keepsakes', keepsakeId);
        
        // Get the current keepsake to access its fileUrls
        const keepsakeDoc = await getDoc(keepsakeRef);
        if (!keepsakeDoc.exists()) {
            return { success: false, error: "Keepsake not found." };
        }
        
        const keepsakeData = keepsakeDoc.data() as Keepsake;
        if (!keepsakeData.fileUrls || keepsakeData.fileUrls.length <= 1) {
            // If only one item left, delete the entire keepsake
            await deleteDoc(keepsakeRef);
        } else {
            // Remove the specific item from the array
            const updatedFileUrls = keepsakeData.fileUrls.filter((_, index) => index !== itemIndex);
            await updateDoc(keepsakeRef, { fileUrls: updatedFileUrls });
        }

        revalidatePath(`/wall?eventSlug=${eventSlug}`);
        revalidatePath(`/admin?eventSlug=${eventSlug}`);
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting gallery item:", error);
        return { success: false, error: "Failed to delete gallery item." };
    }
}
