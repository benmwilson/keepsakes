// Authentication Configuration
// TODO: Replace Firebase imports with Postgres database connection
// import { query } from '@/lib/database';

export const AUTH_CONFIG = {
  SITE_PASSWORD: process.env.NEXT_PUBLIC_SITE_PASSWORD || process.env.SITE_PASSWORD || '',
  // You can add more configuration options here in the future
  // such as multiple passwords, time-based access, etc.
} as const;

// Site configuration functions
export const initializeSiteConfig = async (sitePassword: string) => {
  if (!db) {
    console.warn("Firebase not initialized, cannot initialize site config");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    const configRef = doc(db, 'config', 'site');
    await setDoc(configRef, {
      sitePassword,
      passwordProtectionEnabled: !!sitePassword,
      updatedAt: new Date()
    });
    console.log('Site config initialized with password protection:', !!sitePassword);
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize site config:', error);
    return { success: false, error: 'Failed to initialize site config' };
  }
};

export const getPasswordProtectionStatus = async (): Promise<boolean> => {
  if (!db) {
    console.warn("Firebase not initialized, using environment variable fallback");
    return !!AUTH_CONFIG.SITE_PASSWORD;
  }

  try {
    const configDoc = await getDoc(doc(db, 'config', 'site'));
    if (configDoc.exists()) {
      return configDoc.data()?.passwordProtectionEnabled ?? !!AUTH_CONFIG.SITE_PASSWORD;
    }
  } catch (error) {
    console.warn('Failed to fetch password protection status from Firestore, using fallback');
  }
  return !!AUTH_CONFIG.SITE_PASSWORD;
};

export const setPasswordProtectionStatus = async (enabled: boolean): Promise<{ success: boolean; error?: string }> => {
  if (!db) {
    console.warn("Firebase not initialized, cannot set password protection status");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    const configRef = doc(db, 'config', 'site');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      // Update existing config
      await updateDoc(configRef, {
        passwordProtectionEnabled: enabled,
        updatedAt: new Date()
      });
    } else {
      // Create new config
      await setDoc(configRef, {
        passwordProtectionEnabled: enabled,
        sitePassword: enabled ? AUTH_CONFIG.SITE_PASSWORD : '',
        updatedAt: new Date()
      });
    }
    
    console.log('Password protection status set to:', enabled);
    return { success: true };
  } catch (error) {
    console.error('Failed to set password protection status:', error);
    return { success: false, error: 'Failed to update password protection status' };
  }
};

// Function to get password from Firestore (more secure for production)
export const getSitePassword = async (): Promise<string> => {
  // Check if Firebase is properly initialized
  if (!db) {
    console.warn('Firebase not initialized, using environment variable fallback');
    return AUTH_CONFIG.SITE_PASSWORD;
  }

  try {
    const configDoc = await getDoc(doc(db, 'config', 'site'));
    if (configDoc.exists()) {
      return configDoc.data()?.sitePassword || AUTH_CONFIG.SITE_PASSWORD;
    }
  } catch (error) {
    console.warn('Failed to fetch password from Firestore, using fallback');
  }
  return AUTH_CONFIG.SITE_PASSWORD;
};

export const setSitePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
  if (!db) {
    console.warn("Firebase not initialized, cannot set site password");
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    const configRef = doc(db, 'config', 'site');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      // Update existing config
      await updateDoc(configRef, {
        sitePassword: password,
        passwordProtectionEnabled: !!password,
        updatedAt: new Date()
      });
    } else {
      // Create new config
      await setDoc(configRef, {
        sitePassword: password,
        passwordProtectionEnabled: !!password,
        updatedAt: new Date()
      });
    }
    
    console.log('Site password updated, protection enabled:', !!password);
    return { success: true };
  } catch (error) {
    console.error('Failed to set site password:', error);
    return { success: false, error: 'Failed to update site password' };
  }
};
