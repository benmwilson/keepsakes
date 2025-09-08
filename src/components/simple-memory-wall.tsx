"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Keepsake, Event } from "@/lib/types";
import { clientLogger } from "@/lib/client-logger";
import KeepsakeCard from "./memory-card";
import { getKeepsakesByEventId } from "@/actions/gallery";
import { skipNext, skipPrev, restartAutoplay } from "@/actions/events";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Home,
  LayoutGrid,
  Square,
  Upload,
  Maximize2,
  Minimize2,
  Pin,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import SharedLayout from "./shared-layout";
import DownloadButton from "./download-button";

type SerializableEvent = Omit<Event, "createdAt" | "restartAutoplay"> & { createdAt: string, restartAutoplay?: string };

export default function SimpleMemoryWall({ event: initialEvent }: { event: SerializableEvent }) {
  const [event, setEvent] = useState(initialEvent);
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([]);
  const [selectedKeepsake, setSelectedKeepsake] = useState<Keepsake | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "swipe">("swipe");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [galleryIndices, setGalleryIndices] = useState<Map<string, number>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [popupGalleryIndex, setPopupGalleryIndex] = useState(0);

  const mouseTimeoutRef = useRef<NodeJS.Timeout>();
  const nonFullscreenMouseTimeoutRef = useRef<NodeJS.Timeout>();
  const autoplayTimerRef = useRef<NodeJS.Timeout>();
  const galleryTimerRef = useRef<NodeJS.Timeout>();
  const isMobile = useIsMobile();

  // Log when user visits memory wall
  useEffect(() => {
    clientLogger.guestVisitedWall(event.slug, event.id, viewMode).catch(console.error);
  }, [event.slug, event.id, viewMode]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Mouse activity detection for fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = () => {
      setShowFullscreenControls(true);
      
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      
      mouseTimeoutRef.current = setTimeout(() => {
        setShowFullscreenControls(false);
      }, 3000);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      } else if (event.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + keepsakes.length) % keepsakes.length);
      } else if (event.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % keepsakes.length);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, [isFullscreen, keepsakes.length]);

  // Mouse activity detection for non-fullscreen mode
  useEffect(() => {
    if (isFullscreen || viewMode === "grid") return;

    const handleMouseMove = () => {
      setShowControls(true);
      
      if (nonFullscreenMouseTimeoutRef.current) {
        clearTimeout(nonFullscreenMouseTimeoutRef.current);
      }
      
      nonFullscreenMouseTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + keepsakes.length) % keepsakes.length);
      } else if (event.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % keepsakes.length);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      if (nonFullscreenMouseTimeoutRef.current) {
        clearTimeout(nonFullscreenMouseTimeoutRef.current);
      }
    };
  }, [isFullscreen, viewMode, keepsakes.length]);

  // Start inactivity timer for non-fullscreen mode
  useEffect(() => {
    if (isFullscreen || viewMode === "grid") return;

    // Start the inactivity timer
    nonFullscreenMouseTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      if (nonFullscreenMouseTimeoutRef.current) {
        clearTimeout(nonFullscreenMouseTimeoutRef.current);
      }
    };
  }, [isFullscreen, viewMode, currentIndex]);

  // Handle cursor hiding for non-fullscreen mode
  useEffect(() => {
    if (isFullscreen || viewMode === "grid") {
      document.body.style.cursor = '';
      return;
    }

    if (!showControls) {
      document.body.style.cursor = 'none';
    } else {
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.cursor = '';
    };
  }, [showControls, isFullscreen, viewMode]);

  // Effect for handling event updates and fetching keepsakes
  useEffect(() => {
    if (!initialEvent.id) return;
    
    const fetchKeepsakes = async () => {
      try {
        const fetchedKeepsakes = await getKeepsakesByEventId(initialEvent.id);
        setKeepsakes(fetchedKeepsakes);
        
        // Reset to first keepsake if current index is out of bounds
        if (currentIndex >= fetchedKeepsakes.length) {
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error("Error fetching keepsakes:", error);
      }
    };

    fetchKeepsakes();
    
    // Set up polling for real-time updates (every 5 seconds)
    const interval = setInterval(fetchKeepsakes, 5000);
    
    return () => clearInterval(interval);
  }, [initialEvent.id, currentIndex]);

  // Effect for handling skip controls and restart autoplay
  useEffect(() => {
    if (!initialEvent.id) return;

    const handleSkipControls = async () => {
      try {
        // Check for skip controls in the event data
        if (event.skipNext) {
          setCurrentIndex((prev) => (prev + 1) % keepsakes.length);
          // Clear the skip flag
          await skipNext(initialEvent.id, event.slug);
        }
        if (event.skipPrev) {
          setCurrentIndex((prev) => (prev - 1 + keepsakes.length) % keepsakes.length);
          // Clear the skip flag
          await skipPrev(initialEvent.id, event.slug);
        }

        // Handle restart autoplay
        if (event.restartAutoplay) {
          setCurrentIndex(0);
          setGalleryIndices(new Map());
          // Clear the restart flag
          await restartAutoplay(initialEvent.id, event.slug);
        }
      } catch (error) {
        console.error("Error handling skip controls:", error);
      }
    };

    handleSkipControls();
  }, [event.skipNext, event.skipPrev, event.restartAutoplay, initialEvent.id, event.slug, keepsakes.length]);

  // Simple autoplay logic
  useEffect(() => {
    if (keepsakes.length <= 1 || event.paused || selectedKeepsake) {
      return;
    }

    const currentKeepsake = keepsakes[currentIndex];
    if (!currentKeepsake) return;

    // Clear any existing timers
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
    }
    if (galleryTimerRef.current) {
      clearTimeout(galleryTimerRef.current);
    }

    const advanceToNext = () => {
      setCurrentIndex((prev) => (prev + 1) % keepsakes.length);
    };

    if (currentKeepsake.type === 'video') {
      // For videos, let the video component handle advancement
      console.log('Video keepsake - waiting for video to end');
      return;
         } else if (currentKeepsake.type === 'gallery' && currentKeepsake.fileUrls && currentKeepsake.fileUrls.length > 1) {
       // For galleries, advance through images then to next keepsake
       console.log('Gallery keepsake - starting gallery timer');
       const currentGalleryIndex = galleryIndices.get(currentKeepsake.id) || 0;
       
       const advanceGallery = () => {
         const nextIndex = currentGalleryIndex + 1;
         if (nextIndex >= currentKeepsake.fileUrls!.length) {
           // Gallery complete, advance to next keepsake
           setGalleryIndices(prev => new Map(prev).set(currentKeepsake.id, 0));
           advanceToNext();
         } else {
           // Continue gallery
           setGalleryIndices(prev => new Map(prev).set(currentKeepsake.id, nextIndex));
           galleryTimerRef.current = setTimeout(advanceGallery, event.galleryItemDelay || 5000);
         }
       };
       
       galleryTimerRef.current = setTimeout(advanceGallery, event.galleryItemDelay || 5000);
    } else {
      // For photos and text, use standard delay
      console.log('Standard keepsake - starting autoplay timer');
      autoplayTimerRef.current = setTimeout(advanceToNext, event.autoplayDelay || 5000);
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
      if (galleryTimerRef.current) {
        clearTimeout(galleryTimerRef.current);
      }
    };
  }, [currentIndex, keepsakes, event.paused, event.autoplayDelay, event.galleryItemDelay, galleryIndices, selectedKeepsake]);

  // Reset gallery indices when carousel loops
  useEffect(() => {
    if (currentIndex === 0 && keepsakes.length > 1) {
      console.log('Carousel loop detected - resetting all gallery indices');
      setGalleryIndices(new Map());
    }
  }, [currentIndex, keepsakes.length]);

  const handleVideoEnd = () => {
    console.log('Video ended, advancing to next keepsake');
    setCurrentIndex((prev) => (prev + 1) % keepsakes.length);
  };

  const handleKeepsakeClick = (keepsake: Keepsake) => {
    setSelectedKeepsake(keepsake);
    setPopupGalleryIndex(0); // Reset gallery index when opening popup
  };

  const handleFullscreenToggle = () => {
    if (!isFullscreen) {
      // Entering fullscreen - show controls briefly
      setIsFullscreen(true);
      setShowFullscreenControls(true);
      setTimeout(() => {
        setShowFullscreenControls(false);
      }, 2000);
    } else {
      // Exiting fullscreen
      setIsFullscreen(false);
    }
  };

  // Generate grid classes based on mobileGridColumns setting
  const getGridClasses = () => {
    const mobileColumns = event.mobileGridColumns || 2;
    const maxMobileColumns = Math.min(mobileColumns, 4); // Cap at 4 columns for mobile
    
    // For mobile (default), use the setting value
    // For larger screens, use fixed desktop values (not affected by mobile setting)
    return `grid-cols-${maxMobileColumns} sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`;
  };

  // Grid view
  if (viewMode === "grid") {
    return (
      <>
        <SharedLayout 
          showHeader={!isFullscreen}
          pageType="wall"
          eventSlug={event.slug}
          showViewToggle={true}
          viewMode={viewMode}
          onViewToggle={() => setViewMode(viewMode === "grid" ? "swipe" : "grid")}
          isFullscreen={isFullscreen}
          onFullscreenToggle={handleFullscreenToggle}
        >
          <div className={`w-full h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
            {/* Keepsake display */}
            <div className={`w-full h-full flex items-center justify-center ${!isFullscreen ? 'p-4' : ''}`}>
              {keepsakes.length > 0 ? (
                <div className="w-full h-full">
                  <div className="container mx-auto px-4 py-8">
                    <div className={`grid ${getGridClasses()} gap-4`}>
                      {keepsakes.map((keepsake) => (
                        <KeepsakeCard
                          key={keepsake.id}
                          keepsake={keepsake}
                          isActive={false}
                          isGrid={true}
                          onClick={handleKeepsakeClick}
                          showCaptions={event.showCaptions ?? true}
                          showAuthorNames={event.showAuthorNames ?? true}
                          enableFullscreen={event.enableFullscreen ?? true}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4">
                      <svg className="w-12 h-12 mx-auto text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-foreground">No keepsakes yet</h2>
                    <p className="text-muted-foreground mb-4">Be the first to share a memory!</p>
                    <Link 
                      href={`/upload?eventSlug=${event.slug}`} 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Upload the first keepsake
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SharedLayout>

        {/* Keepsake popup */}
        <Dialog open={!!selectedKeepsake} onOpenChange={() => setSelectedKeepsake(null)}>
          <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col p-4 sm:p-6 rounded-lg">
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
                        currentGalleryIndex={0}
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
                    showCaptions={event.showCaptions ?? true}
                    showAuthorNames={event.showAuthorNames ?? true}
                    enableFullscreen={event.enableFullscreen ?? true}
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

                      {/* Navigation dots - bottom center */}
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

  // Swipe view
  return (
    <SharedLayout 
      showHeader={!isFullscreen}
      pageType="wall"
      eventSlug={event.slug}
      showViewToggle={true}
      viewMode={viewMode}
      onViewToggle={() => setViewMode(viewMode === "grid" ? "swipe" : "grid")}
      isFullscreen={isFullscreen}
      onFullscreenToggle={handleFullscreenToggle}
    >
             <div className={`relative w-full h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
         {/* Fullscreen controls overlay */}
         {isFullscreen && (
           <>
             {/* Top controls */}
             <div className={`absolute top-0 left-0 right-0 z-10 transition-opacity duration-300 ${showFullscreenControls ? 'opacity-100' : 'opacity-0'}`}>
               <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
                 <div className="flex items-center gap-2">
                   <button
                     onClick={handleFullscreenToggle}
                     className="p-2 bg-black/30 text-white rounded-lg hover:bg-black/50 transition-colors"
                   >
                     <Minimize2 className="w-5 h-5" />
                   </button>
                   <span className="text-white text-sm font-medium">
                     {keepsakes[currentIndex]?.name || `Keepsake ${currentIndex + 1}`}
                   </span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-white text-sm">
                     {currentIndex + 1} / {keepsakes.length}
                   </span>
                 </div>
               </div>
             </div>

             {/* Bottom controls */}
             <div className={`absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-300 ${showFullscreenControls ? 'opacity-100' : 'opacity-0'}`}>
               <div className="flex items-center justify-center p-4 bg-gradient-to-t from-black/50 to-transparent">
                 <div className="flex items-center gap-4">
                   <button
                     onClick={() => setCurrentIndex((prev) => (prev - 1 + keepsakes.length) % keepsakes.length)}
                     className="p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
                     disabled={keepsakes.length <= 1}
                   >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                     </svg>
                   </button>
                   
                   <div className="flex items-center gap-2">
                     {keepsakes.map((_, index) => (
                       <button
                         key={index}
                         onClick={() => setCurrentIndex(index)}
                         className={`w-2 h-2 rounded-full transition-colors ${
                           index === currentIndex ? 'bg-white' : 'bg-white/30'
                         }`}
                       />
                     ))}
                   </div>
                   
                   <button
                     onClick={() => setCurrentIndex((prev) => (prev + 1) % keepsakes.length)}
                     className="p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
                     disabled={keepsakes.length <= 1}
                   >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                     </svg>
                   </button>
                 </div>
               </div>
             </div>

             {/* Left/Right navigation areas */}
             <div className="absolute inset-0 z-5 pointer-events-none">
               <div 
                 className="absolute left-0 top-0 bottom-0 w-1/4 pointer-events-auto cursor-pointer"
                 onClick={() => setCurrentIndex((prev) => (prev - 1 + keepsakes.length) % keepsakes.length)}
               />
               <div 
                 className="absolute right-0 top-0 bottom-0 w-1/4 pointer-events-auto cursor-pointer"
                 onClick={() => setCurrentIndex((prev) => (prev + 1) % keepsakes.length)}
               />
             </div>
           </>
         )}


                 {/* Keepsake display */}
         <div className={`w-full h-full flex items-center justify-center ${!isFullscreen ? 'p-4' : ''}`}>
           {keepsakes.length > 0 ? (
             <div className="w-full h-full flex items-center justify-center">
               <KeepsakeCard
                 key={keepsakes[currentIndex].id}
                 keepsake={keepsakes[currentIndex]}
                 isActive={true}
                 isGrid={false}
                 isModal={false}
                 isFullscreen={isFullscreen}
                 onClick={isFullscreen ? undefined : handleKeepsakeClick}
                 onVideoEnd={handleVideoEnd}
                 currentGalleryIndex={galleryIndices.get(keepsakes[currentIndex].id) || 0}
                 showCaptions={event.showCaptions ?? true}
                 showAuthorNames={event.showAuthorNames ?? true}
                 enableFullscreen={event.enableFullscreen ?? true}
               />
             </div>
           ) : (
             <div className="flex items-center justify-center h-full">
               <div className="text-center">
                 <div className="mb-4">
                   <svg className="w-12 h-12 mx-auto text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                   </svg>
                 </div>
                 <h2 className="text-xl font-bold mb-2 text-foreground">No keepsakes yet</h2>
                 <p className="text-muted-foreground mb-4">Be the first to share a memory!</p>
                 <Link 
                   href={`/upload?eventSlug=${event.slug}`} 
                   className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                   </svg>
                   Upload the first keepsake
                 </Link>
               </div>
             </div>
           )}
         </div>

         {/* Pause overlay */}
         {event.paused && (
           <div className={`absolute inset-0 z-20 flex items-center justify-center ${isFullscreen ? 'bg-black/80' : 'bg-background/90'}`}>
             <div className="text-center p-8 rounded-lg bg-card/95 backdrop-blur-sm border shadow-lg">
               <div className="mb-4">
                 <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <h2 className="text-2xl font-bold mb-2">Wall Paused</h2>
               <p className="text-muted-foreground">
                 The keepsake wall is currently paused by an administrator.
               </p>
             </div>
           </div>
         )}

         {/* Non-fullscreen navigation controls */}
         {!isFullscreen && keepsakes.length > 1 && (
           <>
             {/* Left/Right navigation arrows */}
             <button
               onClick={() => setCurrentIndex((prev) => (prev - 1 + keepsakes.length) % keepsakes.length)}
               className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-all duration-300 z-10 ${
                 showControls ? 'opacity-100' : 'opacity-0'
               }`}
               disabled={keepsakes.length <= 1}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
             </button>
             
             <button
               onClick={() => setCurrentIndex((prev) => (prev + 1) % keepsakes.length)}
               className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-all duration-300 z-10 ${
                 showControls ? 'opacity-100' : 'opacity-0'
               }`}
               disabled={keepsakes.length <= 1}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
             </button>

             {/* Bottom navigation dots */}
             <div className={`absolute bottom-[0px] left-1/2 transform -translate-x-1/2 z-10 transition-all duration-300 ${
               showControls ? 'opacity-100' : 'opacity-0'
             }`}>
               <div className="flex items-center gap-2 p-2 bg-black/30 rounded-full backdrop-blur-sm">
                 {keepsakes.map((_, index) => (
                   <button
                     key={index}
                     onClick={() => setCurrentIndex(index)}
                     className={`w-2 h-2 rounded-full transition-colors ${
                       index === currentIndex ? 'bg-white' : 'bg-white/30'
                     }`}
                   />
                 ))}
               </div>
             </div>
           </>
         )}




      </div>

      {/* Keepsake popup */}
      <Dialog open={!!selectedKeepsake} onOpenChange={() => setSelectedKeepsake(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col p-4 sm:p-6 rounded-lg">
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
                      currentGalleryIndex={0}
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
                  showCaptions={event.showCaptions ?? true}
                  showAuthorNames={event.showAuthorNames ?? true}
                  enableFullscreen={event.enableFullscreen ?? true}
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

                    {/* Bottom navigation dots */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
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
    </SharedLayout>
  );
}
