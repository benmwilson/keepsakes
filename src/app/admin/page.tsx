
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSingleEvent } from "@/lib/events";
import AdminDashboard from "@/components/admin-dashboard";
import AdminAuth from "@/components/admin-auth";
import CreateAdminUser from "@/components/create-admin-user";
import { Event } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import SharedLayout from "@/components/shared-layout";
import { checkAdminSession, logoutAdmin, checkAdminUsersExist } from "@/actions/admin-auth";
import { isFirstTimeSetup } from "@/actions/setup";
import { MotionDiv } from "@/components/motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

// Helper function to serialize event object
const serializeEvent = (event: Event) => {
  return {
    ...event,
    createdAt: event.createdAt?.toDate?.()?.toISOString() || null,
    restartAutoplay: event.restartAutoplay?.toDate?.()?.toISOString() || null,
  };
};

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAdminUsers, setHasAdminUsers] = useState<boolean | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventAndCheckAuth = async () => {
      // Check if first-time setup is needed
      const needsSetup = await isFirstTimeSetup();
      if (needsSetup) {
        router.push("/setup");
        return;
      }

      const eventSlug = searchParams.get("eventSlug");
      if (!eventSlug) {
        router.push("/");
        return;
      }

      try {
        const eventData = await getSingleEvent();
        if (!eventData) {
          router.push("/");
          return;
        }

        const serializedEvent = serializeEvent(eventData);
        setEvent(serializedEvent);

        // Check if admin users exist for this event
        const adminUsersCheck = await checkAdminUsersExist(eventData.id);
        setHasAdminUsers(adminUsersCheck.exists);

        // Check if user is already authenticated
        const sessionCheck = await checkAdminSession(eventData.id);
        if (sessionCheck.authenticated) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to fetch event or check auth:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndCheckAuth();
  }, [searchParams, router]);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      // Still set as not authenticated even if logout fails
      setIsAuthenticated(false);
    }
  };

  const handleAdminUserCreated = () => {
    setHasAdminUsers(true);
    // After creating the first admin user, show the login form
    // Don't automatically authenticate - they need to log in with their credentials
  };

  if (loading) {
    return (
      <SharedLayout pageType="admin" eventSlug={searchParams.get("eventSlug") || undefined}>
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </SharedLayout>
    );
  }

  if (!event) {
    return null;
  }

  if (!isAuthenticated) {
    if (hasAdminUsers === false) {
      return (
        <SharedLayout pageType="admin" eventSlug={event.slug} uploadHref={`/upload?eventSlug=${event.slug}`}>
          <CreateAdminUser event={event} onCreated={handleAdminUserCreated} />
        </SharedLayout>
      );
    }
    return <AdminAuth event={event} onAuthenticated={handleAuthenticated} />;
  }

  const handleDirtyChange = (dirty: boolean) => {
    setIsDirty(dirty);
  };

  const handleNavigationAttempt = (target: string) => {
    if (isDirty) {
      setNavigationTarget(target);
    } else {
      window.location.href = target;
    }
  };

  const confirmNavigation = () => {
    if (navigationTarget) {
      window.location.href = navigationTarget;
      setIsDirty(false);
      setNavigationTarget(null);
    }
  };

  const cancelNavigation = () => {
    setNavigationTarget(null);
  };

  return (
    <>
      <SharedLayout 
        pageType="admin" 
        eventSlug={event.slug}
        isDirty={isDirty}
        onNavigationAttempt={handleNavigationAttempt}
        onLogout={handleLogout}
      >
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto p-6 space-y-8"
        >
          <AdminDashboard 
            event={event} 
            onLogout={handleLogout}
            onDirtyChange={handleDirtyChange}
            onNavigationAttempt={handleNavigationAttempt}
          />
        </MotionDiv>
      </SharedLayout>
      
      {/* Navigation confirmation dialog */}
      <AlertDialog open={!!navigationTarget} onOpenChange={() => setNavigationTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes.</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelNavigation}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <SharedLayout pageType="admin">
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </SharedLayout>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
