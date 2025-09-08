"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { videoOptimizer } from "@/lib/video-optimization";

interface DebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  debugInfo: {
    currentKeepsake?: any;
    isVideo?: boolean;
    isVideoPlaying?: boolean;
    isActive?: boolean;
    autoplayUserPaused?: boolean;
    eventPaused?: boolean;
    galleryIndices?: Map<string, number>;
    cacheStats?: any;
  };
}

export default function DebugPanel({ isVisible, onToggle, debugInfo }: DebugPanelProps) {
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    const updateCacheStats = () => {
      setCacheStats(videoOptimizer.getCacheStats());
    };
    
    updateCacheStats();
    const interval = setInterval(updateCacheStats, 2000);
    
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 left-4 z-50"
      >
        Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 w-80 max-h-96 overflow-y-auto z-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Debug Panel</CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Current Keepsake:</strong>
          <div className="ml-2">
            <div>ID: {debugInfo.currentKeepsake?.id || 'None'}</div>
            <div>Type: {debugInfo.currentKeepsake?.type || 'None'}</div>
            <div>Caption: {debugInfo.currentKeepsake?.caption || 'None'}</div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge variant={debugInfo.isVideo ? "default" : "secondary"}>
            Video: {debugInfo.isVideo ? 'Yes' : 'No'}
          </Badge>
          <Badge variant={debugInfo.isVideoPlaying ? "default" : "secondary"}>
            Playing: {debugInfo.isVideoPlaying ? 'Yes' : 'No'}
          </Badge>
          <Badge variant={debugInfo.isActive ? "default" : "secondary"}>
            Active: {debugInfo.isActive ? 'Yes' : 'No'}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Badge variant={debugInfo.autoplayUserPaused ? "destructive" : "secondary"}>
            User Paused: {debugInfo.autoplayUserPaused ? 'Yes' : 'No'}
          </Badge>
          <Badge variant={debugInfo.eventPaused ? "destructive" : "secondary"}>
            Event Paused: {debugInfo.eventPaused ? 'Yes' : 'No'}
          </Badge>
        </div>
        
        {debugInfo.galleryIndices && (
          <div>
            <strong>Gallery Indices:</strong>
            <div className="ml-2">
              {Array.from(debugInfo.galleryIndices.entries()).map(([id, index]) => (
                <div key={id}>{id}: {index}</div>
              ))}
            </div>
          </div>
        )}
        
        {cacheStats && (
          <div>
            <strong>Cache Stats:</strong>
            <div className="ml-2">
              <div>Items: {cacheStats.count}</div>
              <div>Size: {cacheStats.totalSize.toFixed(1)}MB / {cacheStats.maxSize}MB</div>
            </div>
          </div>
        )}
        
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              videoOptimizer.clearCache();
              console.log('Cache cleared');
            }}
            className="w-full"
          >
            Clear Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
