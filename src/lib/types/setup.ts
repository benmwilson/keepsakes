export interface SetupData {
  // Event Configuration
  eventName: string;
  eventSlug: string;
  eventSubtitle?: string;
  eventInstructions?: string;
  
  // Admin User
  adminUsername: string;
  adminPassword: string;
  
  // Security
  sitePassword?: string;
  enablePasswordProtection: boolean;
  
  // Google Analytics
  enableGoogleAnalytics: boolean;
  googleAnalyticsId?: string;
  
  // Event Settings
  consentRequired: boolean;
  allowDownloads: boolean;
  showCaptions: boolean;
  showAuthorNames: boolean;
  enableFullscreen: boolean;
  autoplayDelay: number;
  galleryItemDelay: number;
  galleryTransitionDuration: number;
  mobileGridColumns: number;
  gallerySizeLimit: number;
  emailRegistrationEnabled: boolean;
  
  // Keepsake Types
  enabledKeepsakeTypes: {
    photo: boolean;
    video: boolean;
    text: boolean;
    gallery: boolean;
  };
}
