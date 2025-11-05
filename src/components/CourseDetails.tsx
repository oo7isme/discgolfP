"use client";

import { useState } from "react";
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Calendar, Star, Clock, Ruler, Trophy, TrendingUp, Footprints, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import DgBasketIcon from '@/components/DgBasketIcon';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface CourseDetailsProps {
  course: any;
  onStartGame: (courseId: string) => void;
  isExpanded: boolean;
}

export function CourseDetails({ course, onStartGame, isExpanded }: CourseDetailsProps) {
  const { currentUser } = useCurrentUser();

  const courseHoles = useQuery(api.courses.getHoles, 
    course._id ? { courseId: course._id as any } : "skip"
  );

  const isFavoritedQuery = useQuery(api.favoriteCourses.isFavorited,
    currentUser && course._id ? { userId: currentUser._id, courseId: course._id } : "skip"
  );
  const addToFavorites = useMutation(api.favoriteCourses.addToFavorites);
  const removeFavorite = useMutation(api.favoriteCourses.removeFromFavorites);

  const isFavorited = isFavoritedQuery ?? false;

  const handleFavoriteToggle = async () => {
    if (!currentUser) return;
    if (isFavorited) {
      await removeFavorite({ userId: currentUser._id, courseId: course._id });
    } else {
      await addToFavorites({ userId: currentUser._id, courseId: course._id });
    }
  };

  const totalPar = courseHoles?.reduce((sum, hole) => sum + hole.par, 0) || 0;
  const totalDistance = courseHoles?.reduce((sum, hole) => sum + (hole.distanceMeters || 0), 0) || 0;
  const averagePar = courseHoles?.length ? (totalPar / courseHoles.length).toFixed(1) : 0;
  const averageDistance = courseHoles?.length ? Math.round(totalDistance / courseHoles.length) : 0;
  
  // Calculate additional stats like in the Ekeberg example
  const estimatedPlayTime = courseHoles?.length ? Math.round(courseHoles.length * 4.5) : 0; // ~4.5 minutes per hole
  const playTimeHours = Math.floor(estimatedPlayTime / 60);
  const playTimeMinutes = estimatedPlayTime % 60;
  
  // Calculate distance range
  const distances = courseHoles?.map(hole => hole.distanceMeters || 0).filter(d => d > 0) || [];
  const minDistance = distances.length ? Math.min(...distances) : 0;
  const maxDistance = distances.length ? Math.max(...distances) : 0;
  
  // For specific courses, use the actual data from the images
  const isEkeberg = course.name?.toLowerCase().includes('ekeberg');
  const isKrokhol = course.name?.toLowerCase().includes('krokhol');
  
  // Determine course type based on average distance (in feet)
  const averageDistanceFeet = averageDistance * 3.28084;
  const getCourseType = () => {
    if (isEkeberg) return { type: "Short - Technical", color: "blue" };
    if (isKrokhol) return { type: "Long - highly technical", color: "orange" };
    if (averageDistanceFeet < 200) return { type: "Short - Technical", color: "blue" };
    if (averageDistanceFeet < 300) return { type: "Medium", color: "green" };
    return { type: "Long", color: "orange" };
  };
  
  const courseType = getCourseType();

  if (!isExpanded) return null;

  return (
        <Card className="border-2">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1">{course.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {course.description || 'Disc golf course details'}
                </p>
                {course.location && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{course.location}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                  <TrendingUp className="h-2 w-2 mr-1" />
                  Popular
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavoriteToggle}
                  className="p-1 hover:bg-white/20"
                >
                  <Heart 
                    className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`} 
                  />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            {/* Course Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border">
                <div className="flex items-center justify-center mb-1">
                  <DgBasketIcon className="h-7 w-7 text-primary" size={100} />
                </div>
                <div className="text-sm font-bold text-primary">{course.holes}</div>
                <div className="text-xs text-muted-foreground">Holes</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-lg border">
                <div className="flex items-center justify-center mb-1">
                  <Ruler className="h-3 w-3 text-green-600" />
                </div>
                <div className="text-sm font-bold text-green-600">
                  {isEkeberg ? '1217m' : isKrokhol ? '2125m' : (totalDistance > 0 ? `${Math.round(totalDistance)}m` : 'N/A')}
                </div>
                <div className="text-xs text-muted-foreground">Distance</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg border">
                <div className="flex items-center justify-center mb-1">
                  <Star className="h-3 w-3 text-accent" />
                </div>
                <div className="text-sm font-bold text-accent">{isEkeberg ? '170' : isKrokhol ? '226' : totalPar}</div>
                <div className="text-xs text-muted-foreground">Par</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg border">
                <div className="flex items-center justify-center mb-1">
                  <BarChart3 className="h-3 w-3 text-blue-600" />
                </div>
                <div className="text-xs font-bold text-blue-600 leading-tight">{courseType.type}</div>
                <div className="text-xs text-muted-foreground">Type</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-orange-500/5 to-orange-500/10 rounded-lg border">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-3 w-3 text-orange-600" />
                </div>
                <div className="text-sm font-bold text-orange-600">
                  {isEkeberg ? '1h 26m' : isKrokhol ? '2h 28m' : (playTimeHours > 0 ? `${playTimeHours}h ${playTimeMinutes}m` : `${playTimeMinutes}m`)}
                </div>
                <div className="text-xs text-muted-foreground">Time</div>
              </div>
              <div className="text-center p-2 bg-gradient-to-br from-purple-500/5 to-purple-500/10 rounded-lg border">
                <div className="flex items-center justify-center mb-1">
                  <Footprints className="h-3 w-3 text-purple-600" />
                </div>
                <div className="text-sm font-bold text-purple-600">
                  {isEkeberg ? '3,719' : isKrokhol ? '6,469' : Math.round(totalDistance * 3.28084 * 0.15)}
                </div>
                <div className="text-xs text-muted-foreground">Steps</div>
              </div>
            </div>

            {/* Distance Range Info */}
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                {isEkeberg ? 'Most holes between 45m - 90m' : 
                 isKrokhol ? 'Most holes between 70m - 189m' :
                 (minDistance > 0 && maxDistance > 0 ? 
                  `Most holes between ${minDistance}m - ${maxDistance}m` : 
                  'Distance information not available')}
              </p>
            </div>

            {/* Hole Details */}
            {courseHoles && courseHoles.length > 0 && (
              <div className="border rounded-lg">
                <div className="p-3 border-b">
                  <h4 className="flex items-center gap-2 text-base font-semibold">
                    <DgBasketIcon className="h-8 w-8 text-primary" size={100} />
                    Hole Details
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Distance and par for each hole
                  </p>
                </div>
                <div className="p-3">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 gap-2 mb-2 font-semibold text-xs text-muted-foreground border-b pb-1">
                    <div>HOLES</div>
                    <div>DIST</div>
                    <div>PAR</div>
                  </div>
                  
                  {/* Holes 1-9 */}
                  <div className="space-y-0.5 mb-3">
                    {courseHoles.slice(0, 9).map((hole) => (
                      <div key={hole.hole} className="grid grid-cols-3 gap-2 text-xs">
                        <div className="font-medium">Hole {hole.hole}</div>
                        <div className="text-muted-foreground">
                          {hole.distanceMeters ? `${hole.distanceMeters}m` : 'N/A'}
                        </div>
                        <div className="font-semibold text-primary">{hole.par}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Holes 10-18 */}
                  {courseHoles.length > 9 && (
                    <div className="space-y-0.5">
                      {courseHoles.slice(9, 18).map((hole) => (
                        <div key={hole.hole} className="grid grid-cols-3 gap-2 text-xs">
                          <div className="font-medium">Hole {hole.hole}</div>
                          <div className="text-muted-foreground">
                            {hole.distanceMeters ? `${hole.distanceMeters}m` : 'N/A'}
                          </div>
                          <div className="font-semibold text-primary">{hole.par}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => onStartGame(course._id)}
                className="flex-1 h-10 text-sm font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                🥏 Start Game
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-10 text-sm font-medium"
                onClick={() => {
                  let mapUrl = '';
                  if (isKrokhol) {
                    mapUrl = 'https://maps.app.goo.gl/YhCRfUHR6qYvcYnZ7';
                  } else if (isEkeberg) {
                    mapUrl = 'https://maps.app.goo.gl/h5NxsSf45gXH4jQS6';
                  }
                  if (mapUrl) {
                    window.open(mapUrl, '_blank');
                  }
                }}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Map
              </Button>
            </div>
          </CardContent>
        </Card>
  );
}