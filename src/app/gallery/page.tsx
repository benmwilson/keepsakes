"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getEventBySlug, getKeepsakesByEventId } from "@/actions/gallery";
import type { Keepsake, Event } from "@/lib/types";
import KeepsakeCard from "@/components/memory-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Pin } from "lucide-react";
import SharedLayout from "@/components/shared-layout";
import DownloadButton from "@/components/download-button";

type SerializableEvent = Omit<Event, "createdAt" | "restartAutoplay"> & { createdAt: string, restartAutoplay?: string };

function GalleryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventSlug = searchParams.get('eventSlug');
  
  const [event, setEvent] = useState<SerializableEvent | null>(null);
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([]);
  const [selectedKeepsake, setSelectedKeepsake] = useState<Keepsake | null>(null);
  const [popupGalleryIndex, setPopupGalleryIndex] = useState(0);

  // Effect for handling event document updates
  useEffect(() => {
    if (!eventSlug) {
      router.push('/');
      return;
    }
    
    const fetchEvent = async () => {
      try {
        const eventData = await getEventBySlug(eventSlug);
        if (!eventData) {
          console.error("Event not found:", eventSlug);
          router.push('/');
          return;
        }
        
        setEvent({ 
          ...eventData, 
          id: eventData.id,
          createdAt: eventData.createdAt?.toISOString() || new Date().toISOString(),
          restartAutoplay: eventData.restartAutoplay?.toISOString() || undefined
        });
      } catch (error) {
        console.error("Error fetching event:", error);
        router.push('/');
      }
    };
    
    fetchEvent();
  }, [eventSlug, router]);

  // Effect for handling keepsakes collection updates
  useEffect(() => {
    if (!event?.id) return;
    
    const fetchKeepsakes = async () => {
      try {
        const keepsakesData = await getKeepsakesByEventId(event.id);
        setKeepsakes(keepsakesData);
      } catch (error) {
        console.error("Error fetching keepsakes:", error);
      }
    };
    
    fetchKeepsakes();
  }, [event?.id]);

  const handleKeepsakeClick = (keepsake: Keepsake) => {
    setSelectedKeepsake(keepsake);
    setPopupGalleryIndex(0); // Reset gallery index when opening popup
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Gallery...</h1>
          <p className="text-muted-foreground">Please wait while we load the event gallery.</p>
        </div>
      </div>
    );
  }

  // Check if gallery is enabled
  if (!event.enabledKeepsakeTypes?.gallery) {
    return (
      <SharedLayout 
        showHeader={true}
        pageType="gallery"
        eventSlug={event.slug}
        showViewToggle={false}
        viewMode="grid"
        onViewToggle={() => {}}
        isFullscreen={false}
        onFullscreenToggle={() => {}}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Gallery Not Available</h1>
            <p className="text-muted-foreground mb-6">
              The gallery for this event is not yet ready for viewing. The event organizer will enable it when the event is complete.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Check back later or contact the event organizer for more information.</p>
            </div>
          </div>
        </div>
      </SharedLayout>
    );
  }

  return (
    <>
      <SharedLayout 
        showHeader={true}
        pageType="gallery"
        eventSlug={event.slug}
        showViewToggle={false}
        viewMode="grid"
        onViewToggle={() => {}}
        isFullscreen={false}
        onFullscreenToggle={() => {}}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{event.name} - Gallery</h1>
            {event.subtitle && (
              <p className="text-lg text-muted-foreground">{event.subtitle}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {keepsakes.length} keepsake{keepsakes.length !== 1 ? 's' : ''} shared
            </p>
          </div>
          
          {keepsakes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {keepsakes.map((keepsake) => (
                <KeepsakeCard
                  key={keepsake.id}
                  keepsake={keepsake}
                  isActive={false}
                  isGrid={true}
                  onClick={handleKeepsakeClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No keepsakes have been shared yet.</p>
            </div>
          )}
        </div>
      </SharedLayout>

      {/* Keepsake popup */}
      <Dialog open={!!selectedKeepsake} onOpenChange={() => setSelectedKeepsake(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-4 sm:p-6 rounded-lg">
          {selectedKeepsake && (
            <>
              <DialogHeader className="flex-shrink-0 pr-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DialogTitle className="font-headline truncate mr-2">
                      Keepsake
                    </DialogTitle>
                    {selectedKeepsake.pinned && <Pin className="text-primary size-6" fill="currentColor"/>}
                  </div>
                  <div className="flex gap-2">
                    <DownloadButton 
                      keepsake={selectedKeepsake}
                      currentGalleryIndex={popupGalleryIndex}
                      allowDownloads={event.allowDownloads ?? false}
                      isAdmin={false}
                    />
                  </div>
                </div>
              </DialogHeader>
              <DialogDescription className="text-sm">
                {selectedKeepsake.name && `By ${selectedKeepsake.name} | `}
                {selectedKeepsake.createdAt && typeof selectedKeepsake.createdAt !== 'string' && selectedKeepsake.createdAt && new Date(selectedKeepsake.createdAt).toLocaleString()}
              </DialogDescription>
              <div className="flex-1 min-h-0 bg-muted/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                <KeepsakeCard
                  keepsake={selectedKeepsake}
                  isModal={true}
                  isActive={true}
                  galleryTransitionDuration={event.galleryTransitionDuration || 200}
                  currentGalleryIndex={popupGalleryIndex}
                />
                
                {/* Gallery navigation controls for popup */}
                {selectedKeepsake.type === 'gallery' && selectedKeepsake.fileUrls && selectedKeepsake.fileUrls.length > 1 && (
                  <>
                    {/* Left/Right navigation arrows */}
                    <button
                      onClick={() => setPopupGalleryIndex((prev) => (prev - 1 + selectedKeepsake.fileUrls!.length) % selectedKeepsake.fileUrls!.length)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors z-10"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setPopupGalleryIndex((prev) => (prev + 1) % selectedKeepsake.fileUrls!.length)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors z-10"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Navigation dots - bottom center on mobile and desktop */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="flex items-center gap-2 p-2 bg-black/30 rounded-full backdrop-blur-sm">
                        {selectedKeepsake.fileUrls.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setPopupGalleryIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === popupGalleryIndex ? 'bg-white' : 'bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {selectedKeepsake.caption && (
                <p className="p-4 bg-muted/50 rounded-md italic text-center flex-shrink-0 mt-2">"{selectedKeepsake.caption}"</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <SharedLayout pageType="gallery" eventSlug={undefined} showHeader={true}>
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-12 bg-muted rounded mb-4"></div>
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-6 bg-muted rounded mb-8"></div>
              <div className="h-32 bg-muted rounded mb-8"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </SharedLayout>
    }>
      <GalleryContent />
    </Suspense>
  );
}
