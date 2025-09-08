"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Home, Upload, Settings, LayoutGrid, Square, ArrowLeft, GalleryHorizontal, Maximize2, Minimize2, LogOut } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { MotionDiv } from "./motion";
import { APP_CONFIG } from "@/lib/config";

interface SharedLayoutProps {
  children: ReactNode;
  headerContent?: ReactNode;
  showHomeButton?: boolean;
  showUploadButton?: boolean;
  showViewToggle?: boolean;
  showHeader?: boolean;
  onViewToggle?: () => void;
  viewMode?: "grid" | "swipe";
  uploadHref?: string;
  wallHref?: string;
  eventSlug?: string;
  pageType?: "home" | "upload" | "wall" | "admin" | "thanks" | "terms" | "privacy" | "gallery";
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
  isDirty?: boolean;
  onNavigationAttempt?: (target: string) => void;
  onLogout?: () => void;
}

export default function SharedLayout({
  children,
  headerContent,
  showHomeButton = true,
  showUploadButton = true,
  showViewToggle = false,
  showHeader = true,
  onViewToggle,
  viewMode,
  uploadHref = "/upload",
  wallHref = "/wall",
  eventSlug,
  pageType,
  isFullscreen = false,
  onFullscreenToggle,
  isDirty = false,
  onNavigationAttempt,
  onLogout,
}: SharedLayoutProps) {
  const handleNavigation = (target: string) => {
    if (isDirty && onNavigationAttempt) {
      onNavigationAttempt(target);
    } else {
      window.location.href = target;
    }
  };

  const getRightActionButtons = () => {
    if (headerContent) return [headerContent];

    const buttons = [];

    // Add fullscreen button for wall page in carousel mode
    if (pageType === "wall" && viewMode === "swipe" && onFullscreenToggle) {
      buttons.push(
        <MotionDiv
          key="fullscreen-toggle"
          animate={{ opacity: isFullscreen ? (showFullscreenControls ? 1 : 0) : 1 }}
          transition={{ duration: 0.3 }}
          className={isFullscreen ? "transition-opacity duration-300" : ""}
        >
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-10 w-10"
            onClick={onFullscreenToggle}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </MotionDiv>
      );
    }

    // Add view toggle for wall page
    if (showViewToggle && onViewToggle) {
      buttons.push(
        <Button 
          key="view-toggle"
          variant="secondary" 
          size="icon" 
          className="h-10 w-10"
          onClick={onViewToggle}
        >
          {viewMode === 'grid' ? <Square/> : <LayoutGrid/>}
        </Button>
      );
    }

    // Add the main action button
    switch (pageType) {
      case "upload":
        if (eventSlug) {
          buttons.push(
            <Button 
              key="view-wall" 
              variant="secondary" 
              size="sm" 
              className="h-10"
              onClick={() => handleNavigation(`${wallHref}?eventSlug=${eventSlug}`)}
            >
              <GalleryHorizontal className="mr-2 h-4 w-4" />
              View the Wall
            </Button>
          );
        }
        break;
      case "wall":
        if (eventSlug) {
          buttons.push(
            <Button 
              key="upload-keepsake" 
              variant="secondary" 
              size="sm" 
              className="h-10"
              onClick={() => handleNavigation(`${uploadHref}?eventSlug=${eventSlug}`)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload a Keepsake
            </Button>
          );
        }
        break;
      case "admin":
        if (eventSlug) {
          buttons.push(
            <Button 
              key="view-wall" 
              variant="secondary" 
              size="sm" 
              className="h-10"
              onClick={() => handleNavigation(`${wallHref}?eventSlug=${eventSlug}`)}
            >
              <GalleryHorizontal className="mr-2 h-4 w-4" />
              View the Wall
            </Button>
          );
        }
        if (onLogout) {
          buttons.push(
            <Button 
              key="logout" 
              variant="secondary" 
              size="sm" 
              className="h-10"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          );
        }
        break;
    }

    return buttons;
  };

  // Simple height logic - allow scrolling on specific pages
  const containerHeight = pageType === "upload" || pageType === "terms" || pageType === "privacy" ? "min-h-screen" : "h-screen";

  // Mouse activity detection for fullscreen mode
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const mouseTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = () => {
      setShowFullscreenControls(true);
      
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      
      mouseTimeoutRef.current = setTimeout(() => {
        setShowFullscreenControls(false);
      }, 3000); // Hide after 3 seconds of no mouse activity
    };

    const handleMouseLeave = () => {
      setShowFullscreenControls(false);
    };

    const handleFullscreenControlsShow = () => {
      setShowFullscreenControls(true);
      
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      
      mouseTimeoutRef.current = setTimeout(() => {
        setShowFullscreenControls(false);
      }, 3000);
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

  return (
    <div 
      className={`w-full ${containerHeight} flex flex-col bg-background transition-all duration-300 ease-in-out`}
      style={{
        cursor: isFullscreen && !showFullscreenControls ? 'none' : 'default'
      }}
    >
      <AnimatePresence>
        {showHeader && !isFullscreen && (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 64, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <header className="h-16 px-3 py-2 flex justify-between items-center bg-background/70 backdrop-blur-sm border-b">
              <div className="flex items-center gap-2 h-full">
                {showHomeButton && pageType !== "home" && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-10"
                    onClick={() => handleNavigation("/")}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                )}
              </div>
              <div className="flex gap-2 h-full items-center">
                {getRightActionButtons()}
              </div>
            </header>
          </MotionDiv>
        )}
      </AnimatePresence>

      <main className={`flex-1 flex flex-col relative ${pageType === "upload" || pageType === "terms" || pageType === "privacy" || pageType === "wall" || pageType === "admin" || pageType === "gallery" ? "overflow-auto" : "overflow-hidden"} transition-all duration-300 ease-in-out`}>
        {children}
      </main>

      {/* Hide footer in fullscreen mode, but show on admin page */}
      <AnimatePresence>
        {(!isFullscreen || pageType === "admin") && (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <footer className={`text-white text-center p-2 ${pageType === "wall" || pageType === "admin" ? "" : "mt-auto"}`}>
              {(pageType === "home" || pageType === "terms" || pageType === "privacy" || pageType === "gallery") && (
                <div className="mb-2">
                  <p className="text-sm">
                    <Link href="/terms" className="underline hover:text-gray-300">
                      Terms of Service
                    </Link>
                    {" "}•{" "}
                    <Link href="/privacy" className="underline hover:text-gray-300">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              )}
              <p className="text-sm">
                Made with ❤️ by{" "}
                <a href="https://benmwilson.dev" target="_blank" rel="noopener noreferrer" className="underline">
                  benmwilson.dev
                </a>
              </p>
            </footer>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
