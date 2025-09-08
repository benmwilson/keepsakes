
// TODO: Replace Firebase Timestamp with standard Date for Postgres integration

export interface Event {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  heroImageUrl?: string;
  heroColor?: string;
  instructions?: string;
  consentRequired: boolean;
  paused?: boolean;
  createdAt: Date;
  skipNext?: boolean;
  skipPrev?: boolean;
  autoplayDelay?: number;
  transitionDuration?: number;
  galleryTransitionDuration?: number;
  galleryItemDelay?: number;
  restartAutoplay?: Date;
  allowDownloads?: boolean;
  enabledKeepsakeTypes?: {
    photo: boolean;
    video: boolean;
    text: boolean;
    gallery: boolean;
  };
  showCaptions?: boolean;
  showAuthorNames?: boolean;
  enableFullscreen?: boolean;
  mobileGridColumns?: number;
  gallerySizeLimit?: number;
  emailRegistrationEnabled?: boolean;
}

export interface Keepsake {
  id:string;
  eventId: string;
  type: "photo" | "video" | "text" | "gallery";
  fileUrl?: string; // For single video files
  fileUrls?: string[]; // For multiple photo files
  text?: string;
  caption?: string;
  name?: string;
  createdAt: Date;
  pinned?: boolean;
  hidden?: boolean;
}

export interface GuestEmail {
  id: string;
  eventId: string;
  name?: string;
  email: string;
  hasConsented: boolean;
  createdAt: Date;
}

export type SerializableEvent = Omit<Event, "createdAt" | "restartAutoplay"> & { 
  createdAt: string; 
  restartAutoplay?: string; 
};

    
