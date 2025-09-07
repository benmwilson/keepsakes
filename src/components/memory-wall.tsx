
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  where,
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";
import { db } from "@/lib/firebase";
import type { Keepsake, Event } from "@/lib/types";
import useEmblaCarousel, { UseEmblaCarouselType } from "embla-carousel-react";
import Autoplay, { AutoplayType } from "embla-carousel-autoplay";
import KeepsakeCard from "./memory-card";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselDots } from "./ui/carousel";
import { Button } from "./ui/button";
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
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence } from "framer-motion";
import { MotionDiv } from "./motion";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import SharedLayout from "./shared-layout";
import { videoOptimizer } from "@/lib/video-optimization";
import DownloadButton from "./download-button";

type SerializableEvent = Omit<Event, "createdAt" | "restartAutoplay"> & { createdAt: string, restartAutoplay?: string };

// Custom hook to track previous value of a prop
const usePrevious = <T,>(value: T) => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};



export default function MemoryWall({ event: initialEvent }: { event: SerializableEvent }) {
  const [event, setEvent] = useState(initialEvent);
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([]);
  const [selectedKeepsake, setSelectedKeepsake] = useState<Keepsake | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "swipe">("swipe");
  const [autoplayUserPaused, setAutoplayUserPaused] = useState(false);
  const [galleryIndices, setGalleryIndices] = useState<Map<string, number>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);

  const mouseTimeoutRef = useRef<NodeJS.Timeout>();
  const galleryTimerRef = useRef<NodeJS.Timeout>();
  
  const isMobile = useIsMobile();

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

    const handleMouseLeave = () => {
      setShowFullscreenControls(false);
    };

    const handleFullscreenControlsShow = () => {
      setShowFullscreenControls(true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('fullscreenControlsShow', handleFullscreenControlsShow);

    // Show controls initially
    setShowFullscreenControls(true);
    mouseTimeoutRef.current = setTimeout(() => {
      setShowFullscreenControls(false);
    }, 3000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('fullscreenControlsShow', handleFullscreenControlsShow);
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  // Video preloading effect
  useEffect(() => {
    if (viewMode === "swipe" && keepsakes.length > 0) {
      const videoKeepsakes = keepsakes.filter(k => k.type === 'video');
      const videoPaths = videoKeepsakes.map(k => {
        const videoPath = k.fileUrls?.[0] || k.fileUrl!;
        const url = new URL(videoPath);
        const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
        return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
      }).filter(Boolean) as string[];

      if (videoPaths.length > 0) {
        // Preload videos for better performance
        videoOptimizer.preloadVideos(videoPaths, 0, 3);
      }
    }
  }, [keepsakes, viewMode]);

  // Handle cursor visibility based on fullscreen controls
  useEffect(() => {
    if (isFullscreen) {
      if (showFullscreenControls) {
        document.body.style.cursor = 'default';
        document.documentElement.style.cursor = 'default';
        document.body.classList.remove('cursor-none');
      } else {
        document.body.style.cursor = 'none';
        document.documentElement.style.cursor = 'none';
        document.body.classList.add('cursor-none');
      }
    } else {
      document.body.style.cursor = 'default';
      document.documentElement.style.cursor = 'default';
      document.body.classList.remove('cursor-none');
    }

    return () => {
      document.body.style.cursor = 'default';
      document.documentElement.style.cursor = 'default';
      document.body.classList.remove('cursor-none');
    };
  }, [isFullscreen, showFullscreenControls]);
  const prevEvent = usePrevious(event);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: keepsakes.length > 1,
      align: keepsakes.length <= 2 ? 'center' : 'center',
      duration: event.transitionDuration || 200,
      containScroll: keepsakes.length <= 2 ? 'trimSnaps' : false,
    },
    keepsakes.length > 1 ? [Autoplay({
      delay: event.autoplayDelay || 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      stopOnFocusIn: false,
      playOnInit: false, // Don't start autoplay immediately
    })] : []
  );
  
  // Map to store gallery carousel refs by keepsake ID
  const galleryCarouselRefs = useRef<Map<string, any>>(new Map());
  
  // Debug effect to check if gallery carousel ref is working
  useEffect(() => {
    if (keepsakes.length <= 1) return;
    
    const currentKeepsake = keepsakes[emblaApi?.selectedScrollSnap() || 0];
    const isGallery = currentKeepsake?.type === 'gallery' && currentKeepsake.fileUrls && currentKeepsake.fileUrls.length > 1;
    
    if (isGallery) {
      console.log('Gallery detected:', currentKeepsake.fileUrls?.length, 'images');
      console.log('Gallery ref available:', !!galleryCarouselRefs.current.get(currentKeepsake.id));
    }
  }, [emblaApi?.selectedScrollSnap(), keepsakes]);
  
  const handleVideoPlay = useCallback(() => {
    console.log('Video started playing, pausing carousel autoplay');
    const autoplay = emblaApi?.plugins()?.autoplay;
    if (autoplay) {
      autoplay.stop();
    }
    setAutoplayUserPaused(true);
  }, [emblaApi]);

  const handleVideoEnd = useCallback(() => {
    console.log('Video ended, advancing to next keepsake');
    // Advance to next keepsake when video ends
    if (emblaApi) {
      emblaApi.scrollNext();
    }
    // Restart autoplay for the next keepsake
    setAutoplayUserPaused(false);
  }, [emblaApi]);





  // Effect to handle carousel looping
  useEffect(() => {
    if (!emblaApi || keepsakes.length <= 1) return;

    const handleSettle = () => {
      const currentIndex = emblaApi.selectedScrollSnap();
      const totalSlides = keepsakes.length;
      
      console.log('Carousel settled at index:', currentIndex, 'of', totalSlides);
      
      // If we're at the last slide and autoplay should continue, ensure it loops
      if (currentIndex === totalSlides - 1 && !event.paused && !autoplayUserPaused) {
        const autoplayInstance = emblaApi.plugins().autoplay as AutoplayType | undefined;
        if (autoplayInstance && !autoplayInstance.isPlaying()) {
          console.log('Restarting autoplay at end of carousel');
          autoplayInstance.play();
        }
      }
    };

    emblaApi.on('settle', handleSettle);

    return () => {
      emblaApi.off('settle', handleSettle);
    };
  }, [emblaApi, keepsakes.length, event.paused, autoplayUserPaused]);

  // Effect to handle carousel loop detection and gallery reset
  useEffect(() => {
    if (!emblaApi || keepsakes.length <= 1) return;

    let prevIndex = emblaApi.selectedScrollSnap();

    const handleSelect = () => {
      const currentIndex = emblaApi.selectedScrollSnap();
      
      // Detect loop: if we were at the last slide and now we're at the first
      if (prevIndex === keepsakes.length - 1 && currentIndex === 0) {
        console.log('Carousel loop detected - resetting all gallery indices');
        setGalleryIndices(new Map());
      }

      // Ensure autoplay is enabled for non-video keepsakes
      const currentKeepsake = keepsakes[currentIndex];
      if (currentKeepsake && currentKeepsake.type !== 'video' && !event.paused) {
        setAutoplayUserPaused(false);
      }

      prevIndex = currentIndex;
    };

    emblaApi.on('select', handleSelect);

    return () => {
      emblaApi.off('select', handleSelect);
    };
  }, [emblaApi, keepsakes.length, keepsakes, event.paused]);





  // SIMPLE GALLERY ADVANCEMENT: Single timer approach
  useEffect(() => {
    if (!emblaApi || keepsakes.length <= 1) return;

    const currentIndex = emblaApi.selectedScrollSnap();
    const currentKeepsake = keepsakes[currentIndex];
    
    // Only proceed if this is a gallery with multiple images
    if (currentKeepsake?.type !== 'gallery' || !currentKeepsake.fileUrls || currentKeepsake.fileUrls.length <= 1) {
      return;
    }

    // Don't advance if paused
    if (event.paused || autoplayUserPaused) {
      return;
    }

    const currentGalleryIndex = galleryIndices.get(currentKeepsake.id) || 0;
    const galleryLength = currentKeepsake.fileUrls!.length;

    console.log('Gallery timer started:', {
      keepsakeId: currentKeepsake.id,
      currentGalleryIndex,
      totalImages: galleryLength,
      delay: event.galleryItemDelay || 5000
    });

    // Clear any existing timer
    if (galleryTimerRef.current) {
      clearTimeout(galleryTimerRef.current);
    }

    galleryTimerRef.current = setTimeout(() => {
      // Verify we're still on the same keepsake
      if (emblaApi.selectedScrollSnap() !== currentIndex) {
        console.log('Gallery timer cancelled - carousel moved');
        return;
      }

      if (currentGalleryIndex < galleryLength - 1) {
        // Advance to next image in gallery
        const nextIndex = currentGalleryIndex + 1;
        console.log('Advancing gallery image:', {
          keepsakeId: currentKeepsake.id,
          from: currentGalleryIndex,
          to: nextIndex,
          total: galleryLength
        });

        setGalleryIndices(prev => new Map(prev).set(currentKeepsake.id, nextIndex));
      } else {
        // Gallery complete, advance to next keepsake
        console.log('Gallery complete, advancing to next keepsake');
        setGalleryIndices(prev => new Map(prev).set(currentKeepsake.id, 0));
        emblaApi.scrollNext();
      }
    }, event.galleryItemDelay || 5000);

    // Cleanup
    return () => {
      if (galleryTimerRef.current) {
        clearTimeout(galleryTimerRef.current);
        galleryTimerRef.current = undefined;
      }
    };
  }, [
    emblaApi?.selectedScrollSnap(),
    galleryIndices,
    event.paused,
    autoplayUserPaused,
    event.galleryItemDelay,
    keepsakes.length
  ]);



  // Effect for handling event document updates (pause, skip, etc.)
  useEffect(() => {
    if (!initialEvent.id) return;
    const eventRef = doc(db, "events", initialEvent.id);
    const unsubscribeEvent = onSnapshot(eventRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const eventData = docSnap.data() as Event;
      setEvent({ 
        ...eventData, 
        id: docSnap.id,
        createdAt: (eventData.createdAt as any)?.toDate?.()?.toISOString() || null,
        restartAutoplay: eventData.restartAutoplay?.toDate?.()?.toISOString() || null,
      });
    });

    return () => unsubscribeEvent();
  }, [initialEvent.id]);

  // Effect for handling commands from the admin dashboard
  useEffect(() => {
    if (!emblaApi || !prevEvent) return;

    const eventRef = doc(db, "events", event.id);

    if (event.skipNext && !prevEvent.skipNext) {
      emblaApi.scrollNext();
      updateDoc(eventRef, { skipNext: false });
    }
    
    if (event.skipPrev && !prevEvent.skipPrev) {
      emblaApi.scrollPrev();
      setGalleryIndices(new Map());
      updateDoc(eventRef, { skipPrev: false });
    }
    
    if (event.restartAutoplay && event.restartAutoplay !== prevEvent.restartAutoplay) {
      emblaApi.scrollTo(0);
      setGalleryIndices(new Map());
    }

  }, [event, prevEvent, emblaApi]);

  // Effect to start autoplay after carousel is ready
  useEffect(() => {
    if (!emblaApi || keepsakes.length <= 1) return;

    // Small delay to ensure carousel is fully initialized
    const timer = setTimeout(() => {
      const autoplayInstance = emblaApi.plugins()?.autoplay as AutoplayType | undefined;
      if (!autoplayInstance) return;

      const currentIndex = emblaApi.selectedScrollSnap();
      if (currentIndex < 0 || currentIndex >= keepsakes.length) {
        console.log('Invalid carousel index, skipping autoplay start');
        return;
      }

      const currentKeepsake = keepsakes[currentIndex];
      const isGallery = currentKeepsake?.type === 'gallery' && currentKeepsake.fileUrls && currentKeepsake.fileUrls.length > 1;
      const isVideo = currentKeepsake?.type === 'video';

      // CRITICAL: Never start autoplay for galleries - let the timer handle advancement
      if (!event.paused && !autoplayUserPaused && !isVideo && !isGallery) {
        console.log('Starting autoplay after carousel initialization');
        autoplayInstance.play();
      } else if (isGallery) {
        console.log('CRITICAL: Preventing autoplay start for gallery keepsake');
        autoplayInstance.stop();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [emblaApi, keepsakes.length, event.paused, autoplayUserPaused]);

  // Effect to ensure proper centering for small numbers of keepsakes
  useEffect(() => {
    if (!emblaApi || keepsakes.length === 0) return;

    // For one or two keepsakes, ensure they're properly centered
    if (keepsakes.length <= 2) {
      const timer = setTimeout(() => {
        if (emblaApi) {
          // Force scroll to first slide to ensure proper centering
          emblaApi.scrollTo(0, false);
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [emblaApi, keepsakes.length]);

  // Effect to control autoplay based on event state & user interaction
  useEffect(() => {
    const autoplayInstance = emblaApi?.plugins()?.autoplay as AutoplayType | undefined;
    if (!autoplayInstance || keepsakes.length <= 1) return;

    const currentKeepsake = keepsakes[emblaApi?.selectedScrollSnap() || 0];
    const isGallery = currentKeepsake?.type === 'gallery' && currentKeepsake.fileUrls && currentKeepsake.fileUrls.length > 1;
    const isVideo = currentKeepsake?.type === 'video';
    const currentGalleryIndex = galleryIndices.get(currentKeepsake?.id) || 0;
    const galleryLength = currentKeepsake?.fileUrls?.length || 0;
    const isGalleryInProgress = isGallery && currentGalleryIndex < galleryLength - 1;
  
    console.log('Autoplay control:', {
      eventPaused: event.paused,
      autoplayUserPaused,
      isVideo,
      isGallery,
      isGalleryInProgress,
      currentGalleryIndex,
      galleryLength
    });

    if (event.paused || autoplayUserPaused) {
      console.log('Stopping autoplay: event paused or user paused');
      autoplayInstance.stop();
    } else if (isVideo) {
      // Pause autoplay while video is playing - video will handle advancement
      console.log('Stopping autoplay: video is playing');
      autoplayInstance.stop();
    } else if (isGallery) {
      // CRITICAL: Stop autoplay for ALL galleries - let the timer handle advancement
      console.log('Stopping autoplay: gallery detected, timer will handle advancement');
      autoplayInstance.stop();
    } else {
      // Start autoplay for non-gallery, non-video items
      console.log('Starting autoplay: non-gallery, non-video item');
      autoplayInstance.play();
    }
  }, [event.paused, autoplayUserPaused, emblaApi, keepsakes, galleryIndices]);

  // Effect to handle manual interaction and restart autoplay
  useEffect(() => {
    if (!emblaApi || keepsakes.length <= 1) return;

    const autoplayInstance = emblaApi.plugins().autoplay as AutoplayType | undefined;
    if (!autoplayInstance) return;

    const handleInteraction = () => {
      console.log('Manual interaction detected, checking autoplay reset');
      // Reset autoplay after manual interaction, but NEVER for galleries
      if (!event.paused && !autoplayUserPaused) {
        const currentKeepsake = keepsakes[emblaApi.selectedScrollSnap()];
        const isGallery = currentKeepsake?.type === 'gallery' && currentKeepsake.fileUrls && currentKeepsake.fileUrls.length > 1;
        const isVideo = currentKeepsake?.type === 'video';
        
        // CRITICAL: Never reset autoplay for galleries - let the timer handle advancement
        if (!isGallery && !isVideo) {
          console.log('Manual interaction: Resetting autoplay for non-gallery keepsake');
          autoplayInstance.reset();
        } else if (isGallery) {
          console.log('Manual interaction: Preventing autoplay reset for gallery keepsake');
          autoplayInstance.stop();
        }
      }
    };

    // Listen for manual interactions
    emblaApi.on('select', handleInteraction);
    emblaApi.on('settle', handleInteraction);

    return () => {
      emblaApi.off('select', handleInteraction);
      emblaApi.off('settle', handleInteraction);
    };
  }, [emblaApi, event.paused, autoplayUserPaused, keepsakes]);

  // Effect to reset gallery index when main carousel changes
  useEffect(() => {
    if (keepsakes.length <= 1) return;
    
    const currentIndex = emblaApi?.selectedScrollSnap() || 0;
    const currentKeepsake = keepsakes[currentIndex];
    
    console.log('Main carousel changed to:', currentKeepsake?.id, 'type:', currentKeepsake?.type);
    console.log('Current gallery indices:', Array.from(galleryIndices.entries()));
    
    if (currentKeepsake?.id) {
      // Only reset the gallery index if it's not already set or if we're coming back to a gallery
      const currentGalleryIndex = galleryIndices.get(currentKeepsake.id);
      if (currentGalleryIndex === undefined) {
        setGalleryIndices(prev => {
          const newMap = new Map(prev);
          newMap.set(currentKeepsake.id, 0);
          console.log('Reset gallery index for:', currentKeepsake.id, 'to 0 (first time)');
          return newMap;
        });
      } else {
        console.log('Gallery index already set for:', currentKeepsake.id, 'at:', currentGalleryIndex);
      }
      
      // If it's a gallery, ensure the carousel position matches the index
      if (currentKeepsake.type === 'gallery' && currentKeepsake.fileUrls && currentKeepsake.fileUrls.length > 1) {
        const galleryApi = galleryCarouselRefs.current.get(currentKeepsake.id)?.api;
        if (galleryApi) {
          const targetIndex = galleryIndices.get(currentKeepsake.id) || 0;
          galleryApi.scrollTo(targetIndex);
          console.log('Set gallery carousel for:', currentKeepsake.id, 'to index:', targetIndex);
        }
      }
    }
    
    // Reset all other gallery carousels to position 0 (but don't change their indices)
    keepsakes.forEach((keepsake, index) => {
      if (index !== currentIndex && keepsake.type === 'gallery' && keepsake.fileUrls && keepsake.fileUrls.length > 1) {
        const galleryApi = galleryCarouselRefs.current.get(keepsake.id)?.api;
        if (galleryApi) {
          galleryApi.scrollTo(0);
        }
      }
    });
  }, [emblaApi?.selectedScrollSnap(), keepsakes]);

  // Effect to reset gallery indices when carousel loops back to first slide
  useEffect(() => {
    if (!emblaApi) return;
    
    const currentIndex = emblaApi.selectedScrollSnap();
    if (currentIndex === 0) {
      console.log('Carousel at first slide, resetting all gallery indices');
      // Reset all gallery indices to 0
      setGalleryIndices(new Map());
    }
  }, [emblaApi?.selectedScrollSnap()]);

  // Effect to handle video autoplay when carousel selects a video
  useEffect(() => {
    if (!emblaApi || keepsakes.length <= 1) return;

    const handleSelect = () => {
      const currentIndex = emblaApi.selectedScrollSnap();
      const currentKeepsake = keepsakes[currentIndex];
      
      if (currentKeepsake?.type === 'video') {
        console.log('Carousel selected video, triggering autoplay for:', currentKeepsake.id);
        // Force a re-render to trigger video autoplay
        setGalleryIndices(prev => new Map(prev));
      }
    };

    emblaApi.on('select', handleSelect);

    return () => {
      emblaApi.off('select', handleSelect);
    };
  }, [emblaApi, keepsakes]);



  // Effect for handling keepsakes collection updates
  useEffect(() => {
    if (!initialEvent.id) return;
    const keepsakesQuery = query(
      collection(db, "keepsakes"),
      where("eventId", "==", initialEvent.id)
    );
    const unsubscribeKeepsakes = onSnapshot(keepsakesQuery, (querySnapshot) => {
      const keepsakesData: Keepsake[] = [];
      querySnapshot.forEach((doc) => {
          keepsakesData.push({ id: doc.id, ...doc.data() } as Keepsake);
      });
      
      keepsakesData.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      });

      // Clear all gallery carousel refs when keepsakes update
      galleryCarouselRefs.current = new Map();
      // Reset gallery indices
      setGalleryIndices(new Map());

      const currentIndex = emblaApi?.selectedScrollSnap() || 0;
      setKeepsakes(keepsakesData);
      
      // Give time for the DOM to update before reinitializing
      setTimeout(() => {
        if (emblaApi && keepsakesData.length > 0) {
          console.log('Reinitializing carousel after keepsakes update');
          emblaApi.reInit();
          if (currentIndex < keepsakesData.length) {
            emblaApi.scrollTo(currentIndex, true);
          }
        }
      }, 0);
    });
    return () => unsubscribeKeepsakes();
  }, [initialEvent.id, emblaApi]);
  
  // Effect to re-initialize carousel when slides change
  useEffect(() => {
    if (emblaApi && keepsakes.length > 0) {
        const selectedIndex = emblaApi.selectedScrollSnap();
        emblaApi.reInit();
        if(selectedIndex >= 0 && selectedIndex < keepsakes.length) {
            emblaApi.scrollTo(selectedIndex, true);
        }
        
        // Ensure proper centering for small numbers of keepsakes
        if (keepsakes.length <= 2) {
          // Small delay to ensure carousel is fully initialized
          setTimeout(() => {
            if (emblaApi) {
              emblaApi.scrollTo(0, false);
            }
          }, 100);
        }
    }
  }, [keepsakes, emblaApi]);

  const onKeepsakeClick = useCallback((keepsake: Keepsake) => {
    setSelectedKeepsake(keepsake);
  }, []);

  const wallContent = useMemo(() => {
    if (keepsakes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-2xl font-headline">The wall is empty...</p>
          <p className="text-muted-foreground mt-2">
            Be the first to share a keepsake!
          </p>
          <Button asChild className="mt-4">
            <Link href={`/upload?eventSlug=${event.slug}`}>Upload a Keepsake</Link>
          </Button>
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <ScrollArea className="h-full">
          <div className={`grid grid-cols-${Math.min(event.mobileGridColumns || 2, 4)} sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-2`}>
            {keepsakes.map((keepsake, index) => (
              <MotionDiv
                key={keepsake.id}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring" }}
              >
                <KeepsakeCard 
                  keepsake={keepsake} 
                  onClick={onKeepsakeClick} 
                  isGrid 
                  galleryTransitionDuration={event.galleryTransitionDuration || 200}
                  isActive={false} // Grid view doesn't have active state
                />
              </MotionDiv>
            ))}
          </div>
        </ScrollArea>
      );
    }

    // Swipe mode (desktop and mobile)
    return (
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {keepsakes.map((keepsake, index) => {
            const isActive = emblaApi?.selectedScrollSnap() === index;
            
            return (
            <div
              className={cn(
                "relative flex-[0_0_100%] min-w-0 flex items-center justify-center p-2 sm:p-4 h-full",
                !isMobile && keepsakes.length <= 2 ? "flex-[0_0_100%]" : "flex-[0_0_70%]"
              )}
              key={keepsake.id}
            >
              <KeepsakeCard 
                key={`${keepsake.id}-${isActive ? 'active' : 'inactive'}`}
                keepsake={keepsake} 
                onClick={onKeepsakeClick}
                onVideoPlay={handleVideoPlay}
                onVideoEnd={handleVideoEnd}
                galleryCarouselRefs={keepsake.type === 'gallery' ? galleryCarouselRefs : undefined}
                currentGalleryIndex={keepsake.type === 'gallery' ? (galleryIndices.get(keepsake.id) || 0) : 0}
                galleryTransitionDuration={event.galleryTransitionDuration || 200}
                isActive={isActive}
              />
            </div>
          );
          })}
        </div>
      </div>
    );

  }, [keepsakes, isMobile, viewMode, event.slug, emblaRef, onKeepsakeClick, handleVideoPlay, handleVideoEnd, event.galleryTransitionDuration, emblaApi]);


  return (
    <SharedLayout
      pageType="wall"
      eventSlug={event.slug}
      showViewToggle={true}
      onViewToggle={() => setViewMode(v => v === 'grid' ? 'swipe' : 'grid')}
      viewMode={viewMode}
      uploadHref={`/upload?eventSlug=${event.slug}`}
      isFullscreen={isFullscreen}
      onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
    >
      <AnimatePresence>
        {event.paused && viewMode === "swipe" && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-20 ${isFullscreen ? 'inset-0' : 'inset-0'} bg-black/70 flex items-center justify-center`}
          >
            <div className="text-center text-white p-8">
              <h2 className="text-4xl font-headline">Paused</h2>
              <p className="text-xl mt-2">The keepsake wall is currently paused by the host.</p>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
      <div className="w-full h-full relative">
        {wallContent}
        
        {/* Auto-hiding floating fullscreen exit button */}
        <AnimatePresence>
          {isFullscreen && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 right-4 z-50"
            >
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-opacity duration-300"
                onClick={() => setIsFullscreen(false)}
                onMouseEnter={() => {
                  // Show controls on hover
                  const event = new CustomEvent('fullscreenControlsShow');
                  window.dispatchEvent(event);
                }}
                style={{ 
                  opacity: showFullscreenControls ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>



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
                  <DownloadButton 
                    keepsake={selectedKeepsake}
                    currentGalleryIndex={galleryIndices.get(selectedKeepsake.id) || 0}
                    allowDownloads={event.allowDownloads ?? false}
                  />
                </div>
              </DialogHeader>
               <DialogDescription className="text-sm">
                  {selectedKeepsake.name && `By ${selectedKeepsake.name} | `} 
                  {selectedKeepsake.createdAt && typeof selectedKeepsake.createdAt !== 'string' && selectedKeepsake.createdAt?.toDate?.() && new Date(selectedKeepsake.createdAt.toDate()).toLocaleString()} </DialogDescription>
               <div className="flex-1 min-h-0 bg-muted/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                <KeepsakeCard
                  keepsake={selectedKeepsake}
                  isModal={true}
                  isActive={true}
                  onVideoPlay={handleVideoPlay}
                  onVideoEnd={handleVideoEnd}
                  galleryCarouselRefs={galleryCarouselRefs}
                  currentGalleryIndex={galleryIndices.get(selectedKeepsake.id) || 0}
                  galleryTransitionDuration={event.galleryTransitionDuration || 200}
                />
              </div>
              {selectedKeepsake.caption && (
                <div className="flex-shrink-0 mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="italic text-center text-foreground/90 text-lg leading-relaxed">
                    &ldquo;{selectedKeepsake.caption}&rdquo;
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </SharedLayout>
  );
}
// test
