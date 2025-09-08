
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Keepsake } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Pin } from "lucide-react";
import ReactPlayer from "react-player";
import { Carousel, CarouselContent, CarouselItem, CarouselDots, CarouselPrevious, CarouselNext } from "./ui/carousel";

interface KeepsakeCardProps {
  keepsake: Keepsake;
  onClick?: (keepsake: Keepsake) => void;
  isModal?: boolean;
  isGrid?: boolean;
  onVideoPlay?: () => void;
  onVideoEnd?: () => void;
  galleryCarouselRefs?: React.MutableRefObject<Map<string, any>>;
  currentGalleryIndex?: number;
  galleryTransitionDuration?: number;
  isActive?: boolean;
  isFullscreen?: boolean;
  showCaptions?: boolean;
  showAuthorNames?: boolean;
  enableFullscreen?: boolean;
}

export default function KeepsakeCard({
  keepsake,
  onClick,
  isModal = false,
  isGrid = false,
  onVideoPlay,
  onVideoEnd,
  galleryCarouselRefs,
  currentGalleryIndex = 0,
  galleryTransitionDuration = 200,
  isActive = false,
  isFullscreen = false,
  showCaptions = true,
  showAuthorNames = true,
  enableFullscreen = true,
}: KeepsakeCardProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);



  // Effect to handle video autoplay when card becomes active
  useEffect(() => {
    if (keepsake.type === 'video') {
      if (isActive && !isGrid && (!isModal || isFullscreen)) {
        console.log('Video card became active, starting autoplay:', keepsake.id);
        
        // Reset video to beginning when card becomes active (only for native video)
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
        
        // Small delay to ensure the video element is ready, then start playing
        const timer = setTimeout(() => {
          setIsVideoPlaying(true);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        console.log('Video card became inactive, pausing:', keepsake.id);
        setIsVideoPlaying(false);
      }
    }
  }, [isActive, keepsake.type, keepsake.id, isGrid, isModal, isFullscreen]);

  // Effect to handle gallery position updates
  useEffect(() => {
    if (keepsake.type === 'gallery' && isActive && !isGrid && !isModal && keepsake.fileUrls && keepsake.fileUrls.length > 1) {
      console.log('Gallery position updated:', {
        keepsakeId: keepsake.id,
        currentGalleryIndex,
        totalImages: keepsake.fileUrls.length
      });
    }
  }, [currentGalleryIndex, isActive, keepsake.type, keepsake.id, isGrid, isModal, keepsake.fileUrls]);

  // Effect to directly control video playback for native video element
  useEffect(() => {
    if (keepsake.type === 'video' && videoRef.current) {
      if (isVideoPlaying) {
        console.log('Attempting to play video:', keepsake.id);
        // Try to play the video directly
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Video started playing successfully:', keepsake.id);
          }).catch((error) => {
            console.log('Autoplay prevented:', error);
            // Autoplay was prevented, but that's okay
          });
        }
      } else {
        console.log('Pausing video:', keepsake.id);
        videoRef.current.pause();
      }
    }
  }, [isVideoPlaying, keepsake.type, keepsake.id]);

  // Effect to optimize video loading - temporarily disabled to fix double loading issue
  /*
  useEffect(() => {
    if (keepsake.type === 'video' && (keepsake.fileUrls?.[0] || keepsake.fileUrl)) {
      const videoPath = keepsake.fileUrls?.[0] || keepsake.fileUrl!;
      
      // Extract Firebase Storage path from URL
      const url = new URL(videoPath);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      const storagePath = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
      
      if (storagePath) {
        videoOptimizer.getOptimizedVideoUrl(storagePath)
          .then(url => {
            console.log('Video optimized and cached:', storagePath);
          })
          .catch(error => {
            console.error('Failed to optimize video:', error);
          });
      }
    }
  }, [keepsake.type, keepsake.fileUrls, keepsake.fileUrl]);
  */

  const cardContent = () => {
    switch (keepsake.type) {
      case "photo":
      case "gallery":
        if (keepsake.fileUrls && keepsake.fileUrls.length > 1) {
          return (
            <div className="relative w-full h-full">
              {/* Show current image with fade transition */}
              <div className="relative w-full h-full">
                <Image
                  src={keepsake.fileUrls[currentGalleryIndex || 0]}
                  alt={`${keepsake.caption || "Keepsake Photo"} ${(currentGalleryIndex || 0) + 1}`}
                  fill
                  className="object-contain transition-opacity"
                  style={{ transitionDuration: `${galleryTransitionDuration || 500}ms` }}
                  sizes={isModal ? '75vw' : isGrid ? '30vw' : '70vw'}
                />
              </div>
              
              {/* Gallery indicator - always visible but subtle */}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {(currentGalleryIndex || 0) + 1} / {keepsake.fileUrls.length}
              </div>
            </div>
          );
        }
        return (
          <div className="relative w-full h-full">
            <Image
              src={keepsake.fileUrls?.[0] || keepsake.fileUrl!}
              alt={keepsake.caption || "Keepsake Photo"}
              fill
              className="object-contain"
              sizes={isModal ? '75vw' : isGrid ? '30vw' : '70vw'}
            />
          </div>
        );
      case "video":
        if (isGrid) {
          // In grid mode, show the video but without controls and non-interactive
          return (
            <div className="relative w-full h-full overflow-hidden bg-black">
              <div className="absolute inset-0 flex items-center justify-center">
                <video
                  src={keepsake.fileUrls?.[0] || keepsake.fileUrl}
                  muted={true}
                  loop={true}
                  playsInline={true}
                  className="max-w-full max-h-full w-auto h-auto"
                  style={{ 
                    pointerEvents: 'none',
                    objectFit: 'contain'
                  }}
                />
              </div>
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Video
              </div>
            </div>
          );
        }
        return (
          <div className="w-full h-full relative flex items-center justify-center">
            {(isModal || isFullscreen) ? (
              // Use native video element for modal and fullscreen to ensure proper aspect ratio
              <video
                ref={videoRef}
                src={keepsake.fileUrls?.[0] || keepsake.fileUrl}
                controls
                autoPlay={isVideoPlaying}
                muted={true}
                playsInline={true}
                className={cn(
                  "object-contain",
                  isFullscreen ? "w-auto h-auto max-w-[100vw] max-h-[100dvh]" : "max-w-full max-h-full"
                )}
                style={{
                  maxWidth: isFullscreen ? '100vw' : undefined,
                  maxHeight: isFullscreen ? '100dvh' : undefined,
                }}
                onPlay={onVideoPlay}
                onEnded={() => {
                  console.log('Native video ended:', keepsake.id);
                  // Reset video to beginning before advancing
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                  }
                  onVideoEnd?.();
                }}
                onPause={() => {
                  console.log('Video paused manually:', keepsake.id);
                }}
                onError={(error) => {
                  console.error('Video error:', error);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ReactPlayer
                  src={keepsake.fileUrls?.[0] || keepsake.fileUrl}
                  playing={isVideoPlaying}
                  controls={true}
                  muted={true}
                  width="100%"
                  height="100%"
                  style={{ 
                    borderRadius: !isModal ? '8px 8px 0 0' : '0'
                  }}
                  onPlay={onVideoPlay}
                  onEnded={() => {
                    console.log('ReactPlayer video ended:', keepsake.id);
                    // For ReactPlayer, we can't easily reset the video
                    // The video will restart from the beginning when it becomes active again
                    onVideoEnd?.();
                  }}
                  onPause={() => {
                    console.log('Video paused manually:', keepsake.id);
                  }}
                  onError={(error) => {
                    console.error('Video error:', error);
                  }}
                />
              </div>
            )}
          </div>
        );
      case "text":
        return (
          <div className="flex items-center justify-center h-full w-full p-4 sm:p-8 bg-secondary/60">
            <p 
              className={cn(
                "text-center text-foreground font-headline",
                isModal ? "text-xl md:text-2xl" : "text-xl sm:text-2xl",
                !isModal && "line-clamp-6"
              )}
            >
              &ldquo;{keepsake.text}&rdquo;
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open popup if clicking on carousel navigation
    const target = e.target as HTMLElement;
    if (target.closest('[data-carousel-nav]')) {
      return;
    }
    
    if (onClick && !isModal) {
      onClick(keepsake);
    }
  };

  return (
    <Card 
      // Added a key here to help React re-render correctly when keepsakes change
      // This might help with carousel issues reported previously
      key={keepsake.id} 

      onClick={handleCardClick}
      className={cn(
        "cursor-pointer w-full h-full shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col overflow-hidden bg-secondary/80",
        isGrid ? "aspect-square" : isFullscreen ? "h-full" : "min-h-[300px] max-h-[calc(100vh-8rem)]",
        keepsake.type === 'text' && !isGrid ? 'aspect-auto' : ''
      )}
    >
      <CardContent className={cn(
        "p-0 flex-1 relative flex items-center justify-center bg-secondary/60",
        keepsake.type === 'video' && 'max-h-[inherit]'
        )}>
        {keepsake.pinned && isGrid && <Pin className="absolute top-2 right-2 text-primary z-10 size-6" fill="currentColor"/>}
        {cardContent()}
      </CardContent>
      {((showCaptions && keepsake.caption) || (showAuthorNames && keepsake.name)) && !isGrid && !isModal && keepsake.type !== 'text' &&(
         <CardFooter className="p-4 bg-secondary/80 backdrop-blur-sm">
            <div className="text-center w-full">
                {showCaptions && keepsake.caption && <p className="italic text-muted-foreground/70 text-sm">&ldquo;{keepsake.caption}&rdquo;</p>}
                {showAuthorNames && keepsake.name && <p className="font-semibold text-muted-foreground mt-1 text-sm"> - {keepsake.name}</p>}
            </div>
        </CardFooter>
      )}
       {showAuthorNames && keepsake.name && !isGrid && !isModal && keepsake.type === 'text' &&(
         <CardFooter className="p-4 bg-secondary/80 backdrop-blur-sm">
            <div className="text-center w-full">
                <p className="font-semibold text-muted-foreground mt-1 text-sm"> - {keepsake.name}</p>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
