import { ref, getDownloadURL, getMetadata } from "firebase/storage";
import { storage } from "./firebase";

// Video optimization utilities for Firebase Storage

export interface VideoOptimizationConfig {
  enablePreloading?: boolean;
  enableCaching?: boolean;
  maxCacheSize?: number; // in MB
  preloadDistance?: number; // number of videos to preload ahead
  quality?: 'low' | 'medium' | 'high' | 'auto';
}

export class VideoOptimizer {
  private cache = new Map<string, { url: string; timestamp: number; size: number }>();
  private maxCacheSize: number;
  private preloadQueue: string[] = [];
  private isPreloading = false;

  constructor(config: VideoOptimizationConfig = {}) {
    this.maxCacheSize = config.maxCacheSize || 100; // 100MB default
  }

  // Get optimized video URL with caching
  async getOptimizedVideoUrl(videoPath: string): Promise<string> {
    const cacheKey = this.getCacheKey(videoPath);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const age = Date.now() - cached.timestamp;
      
      // Cache for 1 hour
      if (age < 60 * 60 * 1000) {
        console.log('Video cache hit:', videoPath);
        return cached.url;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    try {
      // Get download URL with metadata
      const storageRef = ref(storage, videoPath);
      const [url, metadata] = await Promise.all([
        getDownloadURL(storageRef),
        getMetadata(storageRef)
      ]);

      // Cache the URL
      this.cacheUrl(cacheKey, url, metadata.size || 0);
      
      console.log('Video loaded and cached:', videoPath, 'Size:', metadata.size);
      return url;
    } catch (error) {
      console.error('Failed to load video:', videoPath, error);
      throw error;
    }
  }

  // Preload videos for better performance
  async preloadVideos(videoPaths: string[], currentIndex: number, distance: number = 2) {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    
    try {
      const toPreload = videoPaths
        .slice(currentIndex + 1, currentIndex + 1 + distance)
        .filter(path => !this.cache.has(this.getCacheKey(path)));

      console.log('Preloading videos:', toPreload.length);

      await Promise.allSettled(
        toPreload.map(path => this.getOptimizedVideoUrl(path))
      );
    } finally {
      this.isPreloading = false;
    }
  }

  // Clear old cache entries
  private cleanupCache() {
    const entries = Array.from(this.cache.entries());
    let totalSize = 0;
    
    // Calculate total cache size
    entries.forEach(([_, data]) => {
      totalSize += data.size;
    });

    // If cache is too large, remove oldest entries
    if (totalSize > this.maxCacheSize * 1024 * 1024) {
      entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .forEach(([key, data]) => {
          this.cache.delete(key);
          totalSize -= data.size;
          if (totalSize <= this.maxCacheSize * 1024 * 1024) return;
        });
    }
  }

  private cacheUrl(key: string, url: string, size: number) {
    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      size
    });
    
    this.cleanupCache();
  }

  private getCacheKey(path: string): string {
    return `video_${path}`;
  }

  // Get cache statistics
  getCacheStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      count: entries.length,
      totalSize: totalSize / (1024 * 1024), // MB
      maxSize: this.maxCacheSize
    };
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
    console.log('Video cache cleared');
  }
}

// Global video optimizer instance
export const videoOptimizer = new VideoOptimizer({
  enablePreloading: true,
  enableCaching: true,
  maxCacheSize: 100, // 100MB
  preloadDistance: 2
});

// Video quality presets for different network conditions
export const getVideoQualityPreset = (networkSpeed?: number) => {
  if (!networkSpeed) return 'auto';
  
  if (networkSpeed < 2) return 'low'; // < 2 Mbps
  if (networkSpeed < 10) return 'medium'; // 2-10 Mbps
  return 'high'; // > 10 Mbps
};

// Network speed detection
export const detectNetworkSpeed = async (): Promise<number> => {
  try {
    const start = performance.now();
    const response = await fetch('/api/network-test', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    const end = performance.now();
    
    const duration = end - start;
    const speed = 1000 / duration; // Rough estimate in Mbps
    
    return Math.min(speed, 50); // Cap at 50 Mbps
  } catch {
    return 5; // Default to 5 Mbps if detection fails
  }
};

// Video preloading hook for React components
export const useVideoPreloader = (videoPaths: string[], currentIndex: number) => {
  const preloadVideos = async () => {
    await videoOptimizer.preloadVideos(videoPaths, currentIndex);
  };

  return { preloadVideos };
};
