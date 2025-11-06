"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle } from "react-leaflet";
import { Icon, LatLng, LatLngBounds } from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MapPin, Target, Layers } from "lucide-react";
import { getHolePath } from "@/lib/holePaths";

// Fix for default marker icons in React Leaflet
const createCustomIcon = (color: string) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="4" fill="white"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const userIcon = createCustomIcon("#3b82f6");
const basketIcon = createCustomIcon("#ef4444");

interface DiscGolfMapProps {
  courseId: string;
  holeNumber: number;
  className?: string;
}

// Component to handle map initialization and size updates
function MapInitializer() {
  const map = useMap();

  useEffect(() => {
    console.log("Map initialized successfully", map);
    // Force map to update size multiple times to ensure it's correct
    const timers = [
      setTimeout(() => {
        map.invalidateSize();
        console.log("Map size invalidated on initialization");
      }, 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 600),
      setTimeout(() => map.invalidateSize(), 1000),
    ];

    // Also invalidate on window resize
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    // Use IntersectionObserver to detect when map becomes visible
    const mapContainer = map.getContainer();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => map.invalidateSize(), 100);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (mapContainer) {
      observer.observe(mapContainer);
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener("resize", handleResize);
      if (mapContainer) {
        observer.unobserve(mapContainer);
      }
    };
  }, [map]);

  return null;
}

// Component to handle map size updates when tab becomes visible
function MapSizeUpdater() {
  const map = useMap();

  useEffect(() => {
    // Force map to update size multiple times to ensure it's correct
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 600),
    ];

    // Also invalidate on window resize
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    // Use IntersectionObserver to detect when map becomes visible
    const mapContainer = map.getContainer();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => map.invalidateSize(), 100);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (mapContainer) {
      observer.observe(mapContainer);
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener("resize", handleResize);
      if (mapContainer) {
        observer.unobserve(mapContainer);
      }
    };
  }, [map]);

  return null;
}

// Component to handle user location tracking
function LocationTracker({ onLocationUpdate }: { onLocationUpdate: (lat: number, lon: number, accuracy: number) => void }) {
  const map = useMap();
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      return;
    }

    // Mobile-friendly options: longer timeout, allow cached positions
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: isMobile ? 15000 : 10000, // Longer timeout for mobile
      maximumAge: isMobile ? 5000 : 1000, // Allow slightly older cached positions on mobile
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        onLocationUpdate(latitude, longitude, accuracy || 0);
        // Don't auto-center on every update, just track location
      },
      (error) => {
        // Handle geolocation errors gracefully
        // Check if error object has the expected structure
        if (error && typeof error === 'object' && 'code' in error) {
          const errorCode = error.code as number;
          // Only log if it's not a permission denied error (user might have denied in browser)
          if (errorCode !== 1) { // 1 = PERMISSION_DENIED
            // Log other errors (timeout, unavailable, etc.) for debugging
            const errorMessages: { [key: number]: string } = {
              1: 'Permission denied',
              2: 'Position unavailable',
              3: 'Timeout',
            };
            const errorMessage = errorMessages[errorCode] || 'Unknown error';
            console.warn(`Geolocation ${errorMessage}:`, error.message || 'No error message');
          }
        }
        // Silently fail for permission denied or malformed errors
      },
      options
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [map, onLocationUpdate]);

  return null;
}


// Component to fit map bounds to show both tee and basket (and hole path if available)
function MapBoundsFit({ 
  teeLocation, 
  basketLocation, 
  userLocation,
  holePath
}: { 
  teeLocation: { lat: number; lon: number } | null;
  basketLocation: { lat: number; lon: number } | null;
  userLocation: { lat: number; lon: number } | null;
  holePath: [number, number][] | null;
}) {
  const map = useMap();

  useEffect(() => {
    const bounds: LatLng[] = [];
    
    // Always add tee position if available (required for visibility)
    if (teeLocation) {
      bounds.push(new LatLng(teeLocation.lat, teeLocation.lon));
    }
    
    // Always add basket position if available (required for visibility)
    if (basketLocation) {
      bounds.push(new LatLng(basketLocation.lat, basketLocation.lon));
    }
    
    // Add all points from the hole path if available (for curved/dogleg holes)
    // This ensures the entire path is visible, but tee and basket are always included
    if (holePath && holePath.length > 0) {
      holePath.forEach(([lat, lon]) => {
        bounds.push(new LatLng(lat, lon));
      });
    }
    
    // Add user location if available (for better context, but not required)
    if (userLocation) {
      bounds.push(new LatLng(userLocation.lat, userLocation.lon));
    }
    
    // If we have at least 2 points (tee and basket), fit bounds
    if (bounds.length >= 2) {
      const boundsObject = new LatLngBounds(bounds);
      map.fitBounds(boundsObject, { 
        padding: [50, 50],
        maxZoom: 19
      });
    } else if (bounds.length === 1) {
      // If only one point, center on it with appropriate zoom
      map.setView(bounds[0], 18);
    }
  }, [map, teeLocation, basketLocation, userLocation, holePath]);

  return null;
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Haversine formula to calculate distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DiscGolfMap({ courseId, holeNumber, className = "" }: DiscGolfMapProps) {
  const { currentUser } = useCurrentUser();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [basketLocation, setBasketLocation] = useState<{ lat: number; lon: number } | null>(null);
  // Initialize with default center immediately so map always renders
  const [mapCenter, setMapCenter] = useState<[number, number]>([59.9139, 10.7522]); // Oslo, Norway default
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite'>('satellite');

  // Debug logging
  useEffect(() => {
    console.log('DiscGolfMap mounted', { courseId, holeNumber, mapCenter });
  }, [courseId, holeNumber, mapCenter]);

  // Get course holes to find tee position for current hole
  const courseHoles = useQuery(
    api.courses.getHoles,
    courseId ? { courseId: courseId as any } : "skip"
  );
  
  // Get tee and basket positions for current hole from course data
  const currentHoleData = useMemo(() => {
    if (!courseHoles || !holeNumber) return null;
    return courseHoles.find(h => h.hole === holeNumber);
  }, [courseHoles, holeNumber]);

  const teePosition = useMemo(() => {
    if (!currentHoleData || !currentHoleData.teeLat || !currentHoleData.teeLon) return null;
    return { lat: currentHoleData.teeLat, lon: currentHoleData.teeLon };
  }, [currentHoleData]);

  const courseBasketPosition = useMemo(() => {
    if (!currentHoleData || !currentHoleData.basketLat || !currentHoleData.basketLon) return null;
    return { lat: currentHoleData.basketLat, lon: currentHoleData.basketLon };
  }, [currentHoleData]);

  // Load basket from course data only (read-only, users cannot modify)
  useEffect(() => {
    if (!courseId || !holeNumber || !courseHoles) {
      setIsLoading(false);
      return;
    }

    const storageKey = `basket_${courseId}_${holeNumber}`;
    
    // Priority: course data > localStorage (for instant loading) > null
    // Note: Basket position is read-only from course data, users cannot modify it
    // We ignore Convex baskets set by users - only use course data
    
    // First, try course data (most authoritative source)
    if (courseBasketPosition) {
      console.log('Setting basket from course data:', courseBasketPosition);
      setBasketLocation(courseBasketPosition);
      // Save course basket to localStorage for instant load next time
      localStorage.setItem(storageKey, JSON.stringify(courseBasketPosition));
      setIsLoading(false);
      return;
    }

    // Fallback to localStorage (for instant loading while course data loads)
    const cachedBasket = localStorage.getItem(storageKey);
    if (cachedBasket) {
      try {
        const parsed = JSON.parse(cachedBasket);
        setBasketLocation({ lat: parsed.lat, lon: parsed.lon });
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Error parsing cached basket:", e);
      }
    }

    // No basket found
    console.log('No basket position found for hole', holeNumber);
    setBasketLocation(null);
    setIsLoading(false);
  }, [courseId, holeNumber, courseBasketPosition, courseHoles]);

  // Handle location updates
  const handleLocationUpdate = useCallback((lat: number, lon: number, accuracy: number) => {
    setUserLocation({ lat, lon, accuracy });
    setGpsError(null);
    
    // Center map on user location if basket not set and map is initialized
    if (!basketLocation && mapInitialized) {
      setMapCenter([lat, lon]);
    }
  }, [basketLocation, mapInitialized]);

  // Calculate distance from user to basket
  const distance = useMemo(() => {
    if (!userLocation || !basketLocation) return null;
    return calculateDistance(userLocation.lat, userLocation.lon, basketLocation.lat, basketLocation.lon);
  }, [userLocation, basketLocation]);

  const debouncedDistance = useDebounce(distance, 100);

  // Check if user is within 500m of basket (for showing distance tracking)
  const isUserNearBasket = useMemo(() => {
    if (!distance) return false;
    return distance <= 500; // 500 meters threshold
  }, [distance]);

  // Request geolocation permission and initialize map center
  useEffect(() => {
    if (typeof window === "undefined" || mapInitialized) return;

    // Request geolocation permission immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapInitialized(true);
          setGpsError(null);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setGpsError("Location access denied. Please enable location services.");
          setMapInitialized(true);
          // Keep default center
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Longer timeout for mobile devices
          maximumAge: 5000, // Allow cached positions for faster initial load
        }
      );
    } else {
      setGpsError("Geolocation is not supported by your browser.");
      setMapInitialized(true);
    }
  }, [mapInitialized]);

  // Update map center when priority locations change (after initialization)
  // Priority: tee position > user location > basket location
  useEffect(() => {
    if (!mapInitialized) return;

    if (teePosition) {
      setMapCenter([teePosition.lat, teePosition.lon]);
    } else if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lon]);
    } else if (basketLocation) {
      setMapCenter([basketLocation.lat, basketLocation.lon]);
    }
  }, [teePosition, userLocation, basketLocation, mapInitialized]);

  // Get the actual hole path from GeoJSON (curved/dogleg paths)
  const holePath = useMemo(() => {
    return getHolePath(holeNumber);
  }, [holeNumber]);

  // Calculate polyline points - from user/tee to basket (for distance tracking)
  const polylinePoints = useMemo(() => {
    const startPoint = userLocation || teePosition;
    if (!startPoint || !basketLocation) return [];
    return [
      [startPoint.lat, startPoint.lon] as [number, number],
      [basketLocation.lat, basketLocation.lon] as [number, number],
    ];
  }, [userLocation, teePosition, basketLocation]);

  if (typeof window === "undefined") {
    return (
      <div className={`relative w-full h-full ${className} flex items-center justify-center bg-muted/50 rounded-xl`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error boundary
  if (mapError) {
    return (
      <div className={`relative w-full h-full ${className} flex items-center justify-center bg-red-50 rounded-xl border-2 border-red-200`}>
        <div className="text-center p-4">
          <p className="text-sm font-medium text-red-600 mb-2">Map Error</p>
          <p className="text-xs text-red-500 mb-4">{mapError}</p>
          <Button
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
            variant="outline"
            size="sm"
          >
            Reload Map
          </Button>
        </div>
      </div>
    );
  }

  // Verify Leaflet is loaded
  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).L === "undefined") {
      console.error("Leaflet is not loaded!");
      setMapError("Leaflet map library failed to load. Please refresh the page.");
    }
  }, []);

  return (
    <div className={`relative ${className}`} style={{ height: '100%', width: '100%', minHeight: '400px' }}>
      <MapContainer
        center={mapCenter}
        zoom={18}
        style={{ height: "100%", width: "100%", zIndex: 0, minHeight: '400px' }}
        className="rounded-xl"
        key={`map-${courseId}-${holeNumber}`}
      >
        {/* Standard OpenStreetMap layer */}
        {mapLayer === 'standard' && (
          <TileLayer
            key="standard"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              loading: () => console.log("TileLayer loading"),
              load: () => {
                console.log("TileLayer loaded");
                // Hide POI markers by hiding elements with common POI classes
                const style = document.createElement('style');
                style.id = 'leaflet-hide-pois';
                style.textContent = `
                  .leaflet-container img[src*="poi"] {
                    display: none !important;
                  }
                  .leaflet-container .leaflet-marker-icon[src*="poi"] {
                    display: none !important;
                  }
                `;
                if (!document.getElementById('leaflet-hide-pois')) {
                  document.head.appendChild(style);
                }
              },
              error: (e) => {
                console.error("TileLayer error", e);
                setMapError("Failed to load map tiles. Check your internet connection.");
              },
            }}
          />
        )}
        
        {/* Satellite/Imagery layer */}
        {mapLayer === 'satellite' && (
          <TileLayer
            key="satellite"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            eventHandlers={{
              loading: () => console.log("Satellite TileLayer loading"),
              load: () => {
                console.log("Satellite TileLayer loaded");
              },
              error: (e) => {
                console.error("Satellite TileLayer error", e);
                setMapError("Failed to load satellite tiles. Check your internet connection.");
              },
            }}
          />
        )}
        
        <MapInitializer />
        <MapSizeUpdater />
        <MapBoundsFit 
          teeLocation={teePosition}
          basketLocation={basketLocation}
          userLocation={isUserNearBasket ? userLocation : null}
          holePath={holePath}
        />
        <LocationTracker onLocationUpdate={handleLocationUpdate} />

        {/* Tee marker (from course data) */}
        {teePosition && (
          <Marker
            position={[teePosition.lat, teePosition.lon]}
            icon={createCustomIcon("#22c55e")}
          />
        )}

        {/* User location marker - only show if user is within 500m of basket */}
        {userLocation && isUserNearBasket && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lon]}
              icon={userIcon}
            />
            {/* Accuracy circle */}
            {userLocation.accuracy > 0 && (
              <Circle
                center={[userLocation.lat, userLocation.lon]}
                radius={userLocation.accuracy}
                pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.1 }}
              />
            )}
          </>
        )}

        {/* Basket marker */}
        {basketLocation && (
          <Marker
            position={[basketLocation.lat, basketLocation.lon]}
            icon={basketIcon}
          />
        )}

        {/* Actual hole path from GeoJSON (curved/dogleg path from tee to basket) */}
        {holePath && holePath.length >= 2 && (
          <Polyline
            positions={holePath as [number, number][]}
            pathOptions={{ color: "#22c55e", weight: 3, opacity: 0.7 }}
          />
        )}
        
        {/* Fallback: straight line from tee to basket if no GeoJSON path available */}
        {!holePath && teePosition && basketLocation && (
          <Polyline
            positions={[
              [teePosition.lat, teePosition.lon] as [number, number],
              [basketLocation.lat, basketLocation.lon] as [number, number],
            ]}
            pathOptions={{ color: "#22c55e", weight: 3, opacity: 0.7 }}
          />
        )}

        {/* Polyline connecting user/tee to basket (for distance tracking) - only if user is within 500m */}
        {polylinePoints.length === 2 && userLocation && isUserNearBasket && (
          <Polyline
            positions={polylinePoints}
            pathOptions={{ color: "#ef4444", weight: 3, dashArray: "5, 10" }}
          />
        )}
      </MapContainer>

      {/* Map Layer Toggle Button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          onClick={() => setMapLayer(mapLayer === 'standard' ? 'satellite' : 'standard')}
          variant="outline"
          size="sm"
          className="bg-white/95 backdrop-blur-sm shadow-lg border-2 hover:bg-white"
        >
          <Layers className="h-4 w-4 mr-2" />
          {mapLayer === 'standard' ? 'Satellite' : 'Map'}
        </Button>
      </div>

    </div>
  );
}

