// Authentication Configuration Constants
export const AUTH_CONFIG = {
  SITE_PASSWORD: process.env.NEXT_PUBLIC_SITE_PASSWORD || process.env.SITE_PASSWORD || '',
  // You can add more configuration options here in the future
  // such as multiple passwords, time-based access, etc.
} as const;
