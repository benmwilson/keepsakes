// App-wide configuration
export const APP_CONFIG = {
  // Default event slug for demo/fallback
  // Can be overridden with NEXT_PUBLIC_DEFAULT_EVENT_SLUG environment variable
  DEFAULT_EVENT_SLUG: process.env.NEXT_PUBLIC_DEFAULT_EVENT_SLUG || "my-event",
  
  // Default event details (used when creating demo events)
  DEFAULT_EVENT: {
    name: "My Special Event",
    subtitle: "Celebrating Together!",
    heroImageUrl: "https://placehold.co/1200x600.png",
    instructions: "Share your favorite memory from this event! It can be a photo, a short video, or a heartfelt message. We'll be showing these on a big screen during the event.",
    consentRequired: true,
    paused: false,
  },
  
  // App metadata
  APP_NAME: "Keepsakes",
  APP_CREATOR: "Ben Wilson",
  CREATOR_URL: "https://benmwilson.dev",
} as const;
