"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from "react-leaflet";
import { Icon, LatLng, LatLngBounds, type LeafletMouseEvent } from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getHolePath } from "@/lib/holePaths";
import "leaflet/dist/leaflet.css";

// Create custom icons for tee and basket
const createTeeIcon = () => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="#22c55e" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">T</text>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const createBasketIcon = () => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">B</text>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const teeIcon = createTeeIcon();
const basketIcon = createBasketIcon();

interface CourseMapProps {
  courseId: string;
  className?: string;
}

// Component to fit map bounds to show all holes
function MapBoundsFit({ holes }: { holes: Array<{ teeLat?: number; teeLon?: number; basketLat?: number; basketLon?: number }> }) {
  const map = useMap();

  useEffect(() => {
    const bounds: LatLng[] = [];
    
    holes.forEach((hole) => {
      if (hole.teeLat && hole.teeLon) {
        bounds.push(new LatLng(hole.teeLat, hole.teeLon));
      }
      if (hole.basketLat && hole.basketLon) {
        bounds.push(new LatLng(hole.basketLat, hole.basketLon));
      }
    });

    if (bounds.length > 0) {
      // Create LatLngBounds from array of LatLng objects
      const boundsObject = new LatLngBounds(bounds);
      // Add padding
      map.fitBounds(boundsObject, { padding: [50, 50] });
    }
  }, [map, holes]);

  return null;
}

// Component to handle map size updates
function MapSizeUpdater() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function CourseMap({ courseId, className = "" }: CourseMapProps) {
  const courseHoles = useQuery(
    api.courses.getHoles,
    courseId ? { courseId: courseId as any } : "skip"
  );

  const course = useQuery(
    api.courses.getById,
    courseId ? { id: courseId as any } : "skip"
  );

  // Filter holes that have both tee and basket positions
  const holesWithPositions = useMemo(() => {
    if (!courseHoles) return [];
    return courseHoles.filter(
      (hole: { teeLat?: number; teeLon?: number; basketLat?: number; basketLon?: number }) => 
        hole.teeLat && hole.teeLon && hole.basketLat && hole.basketLon
    );
  }, [courseHoles]);

  // Calculate center point from course location or holes
  const mapCenter = useMemo(() => {
    if (course?.latitude && course?.longitude) {
      return [course.latitude, course.longitude] as [number, number];
    }
    if (holesWithPositions.length > 0) {
      const avgLat =
        holesWithPositions.reduce((sum: number, h: { teeLat?: number; basketLat?: number }) => sum + (h.teeLat || 0) + (h.basketLat || 0), 0) /
        (holesWithPositions.length * 2);
      const avgLon =
        holesWithPositions.reduce((sum: number, h: { teeLon?: number; basketLon?: number }) => sum + (h.teeLon || 0) + (h.basketLon || 0), 0) /
        (holesWithPositions.length * 2);
      return [avgLat, avgLon] as [number, number];
    }
    // Default to Oslo, Norway
    return [59.9139, 10.7522] as [number, number];
  }, [course, holesWithPositions]);

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

  if (!courseHoles || holesWithPositions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Course map not available. Tee and basket positions need to be set for each hole.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '500px' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0, minHeight: '500px' }}
        className="rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapSizeUpdater />
        <MapBoundsFit holes={holesWithPositions} />

        {/* Render all holes */}
        {holesWithPositions.map((hole: { hole: number; par: number; distanceMeters?: number; teeLat?: number; teeLon?: number; basketLat?: number; basketLon?: number }) => (
          <div key={hole.hole}>
            {/* Tee marker */}
            <Marker
              position={[hole.teeLat!, hole.teeLon!]}
              icon={teeIcon}
            >
              <Popup>
                <div>
                  <strong>Hole {hole.hole} - Tee</strong>
                  <br />
                  Par {hole.par}
                  {hole.distanceMeters && <><br />{hole.distanceMeters}m</>}
                </div>
              </Popup>
            </Marker>

            {/* Basket marker */}
            <Marker
              position={[hole.basketLat!, hole.basketLon!]}
              icon={basketIcon}
            >
              <Popup>
                <div>
                  <strong>Hole {hole.hole} - Basket</strong>
                  <br />
                  Par {hole.par}
                  {hole.distanceMeters && <><br />{hole.distanceMeters}m</>}
                </div>
              </Popup>
            </Marker>

            {/* Actual hole path from GeoJSON (curved/dogleg path) or fallback to straight line */}
            {(() => {
              const path = getHolePath(hole.hole);
              const positions = path || [
                [hole.teeLat!, hole.teeLon!],
                [hole.basketLat!, hole.basketLon!],
              ];
              
              // Calculate midpoint of the path for the hole number label
              const midIndex = Math.floor(positions.length / 2);
              const midpoint = positions[midIndex] || [
                (hole.teeLat! + hole.basketLat!) / 2,
                (hole.teeLon! + hole.basketLon!) / 2,
              ];
              
              return (
                <>
                  <Polyline
                    positions={positions as [number, number][]}
                    pathOptions={{
                      color: hole.par === 3 ? "#3b82f6" : hole.par === 4 ? "#ef4444" : "#f59e0b",
                      weight: 3,
                      opacity: 0.8,
                    }}
                  />
                  
                  {/* Hole number label at midpoint of path */}
                  <Marker
                    position={midpoint as [number, number]}
                    icon={
                      new Icon({
                        iconUrl: `data:image/svg+xml;base64,${btoa(`
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="18" fill="white" stroke="#000" stroke-width="2" opacity="0.9"/>
                            <text x="20" y="26" text-anchor="middle" fill="#000" font-size="16" font-weight="bold">${hole.hole}</text>
                          </svg>
                        `)}`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                        className: "hole-number-marker",
                      })
                    }
                  />
                </>
              );
            })()}
          </div>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-[1] bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
        <div className="space-y-2 text-xs">
          <div className="font-semibold mb-2">Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border border-white"></div>
            <span>Tee</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border border-white"></div>
            <span>Basket</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-0.5 bg-blue-500"></div>
              <span>Par 3</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-0.5 bg-red-500"></div>
              <span>Par 4</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-orange-500"></div>
              <span>Par 5+</span>
            </div>
          </div>
          <div className="text-center pt-2 border-t">
            <Badge variant="secondary" className="text-xs">
              {holesWithPositions.length} holes
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

