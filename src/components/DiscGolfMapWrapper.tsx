"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";

// Loading component
const MapLoading = () => (
  <Card className="h-full">
    <CardContent className="p-4 flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </CardContent>
  </Card>
);

// Dynamically import DiscGolfMap with proper configuration
// Explicitly handle the default export to avoid chunk loading issues
const DiscGolfMap = dynamic(
  () => import("./DiscGolfMap").then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
);

interface DiscGolfMapWrapperProps {
  courseId: string;
  holeNumber: number;
  className?: string;
}

export default function DiscGolfMapWrapper({ courseId, holeNumber, className }: DiscGolfMapWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    console.log('DiscGolfMapWrapper mounted', { courseId, holeNumber });
    
    // Force remount when courseId or holeNumber changes
    setKey(prev => prev + 1);
  }, [courseId, holeNumber]);

  // Check if Leaflet is available (with retry limit)
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      let retryCount = 0;
      const maxRetries = 10; // Stop after 5 seconds (10 * 500ms)
      
      const checkLeaflet = () => {
        if (typeof (window as any).L === 'undefined') {
          retryCount++;
          if (retryCount < maxRetries) {
            // Try to wait a bit more for Leaflet to load
            setTimeout(checkLeaflet, 500);
          } else {
            // Leaflet failed to load after max retries - this is expected during SSR
            // The map will handle its own loading state
          }
        } else {
          // Leaflet is loaded successfully
          console.log('Leaflet is loaded');
        }
      };
      checkLeaflet();
    }
  }, [mounted]);

  if (!mounted) {
    return <MapLoading />;
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm font-medium text-red-600 mb-2">Failed to load map</p>
            <p className="text-xs text-red-500 mb-4">{error.message}</p>
            <button
              onClick={() => {
                setError(null);
                setKey(prev => prev + 1);
              }}
              className="text-xs px-3 py-1 border rounded"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className} style={{ height: '100%', width: '100%', minHeight: '400px', position: 'relative' }}>
      <DiscGolfMap 
        key={`map-${courseId}-${holeNumber}-${key}`}
        courseId={courseId} 
        holeNumber={holeNumber} 
        className="h-full w-full"
      />
    </div>
  );
}

