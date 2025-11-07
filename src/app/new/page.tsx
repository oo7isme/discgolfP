"use client";

import { useState } from "react";
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FriendSelector } from '@/components/FriendSelector';
import { CourseDetails } from '@/components/CourseDetails';
import { StartRoundModal } from '@/components/StartRoundModal';
import { Search, Heart, MapPin, Calendar, ChevronDown, ChevronRight, Pin } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Participant {
  id: string;
  type: 'user' | 'guest';
  name: string;
  email?: string;
  userId?: any;
}

interface ScoreData {
  [participantId: string]: {
    [hole: number]: number;
  };
}

export default function NewGamePage() {
  const { user, currentUser } = useCurrentUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const courses = useQuery(api.courses.getAll);
  const { toast } = useToast();

  const selectedCourseData = courses?.find(c => c._id === selectedCourseId);

  // Filter courses based on search query
  const filteredCourses = courses?.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.location && course.location.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handleStartGame = (courseId: string) => {
    setSelectedCourseId(courseId);
    setIsModalOpen(true);
  };

  const handleStartFromModal = (params: {
    courseId: string;
    roundType: string;
    participants: Participant[];
    weather?: any;
  }) => {
    // Build URL with game setup parameters
    const urlParams = new URLSearchParams({
      courseId: params.courseId,
      roundType: params.roundType,
      participants: encodeURIComponent(JSON.stringify(params.participants))
    });

    // Add weather if available
    if (params.weather) {
      urlParams.append('weather', encodeURIComponent(JSON.stringify(params.weather)));
    }

    // Navigate to score page
    router.push(`/score?${urlParams.toString()}`);
  };


    return (
    <div className="p-3 space-y-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">New Round</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Choose a course and start your disc golf round
        </p>
      </div>

      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        
        {/* Course List */}
        <div className="space-y-3">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <div key={course._id} className="space-y-2">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Course Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{course.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            {course.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{course.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {course.holes} holes
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Course Badges */}
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{course.holes} holes</Badge>
                        {course.difficulty && (
                          <Badge variant="outline" className="text-xs">{course.difficulty}</Badge>
                        )}
                        {course.estimatedLengthMeters && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(course.estimatedLengthMeters / 1000)}km
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStartGame(course._id)}
                          size="sm"
                          className="flex-1 h-10"
                        >
                          Start Game
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedCourseId(expandedCourseId === course._id ? null : course._id)}
                          className="flex-1 h-10 flex items-center justify-center gap-1"
                        >
                          <span>Details</span>
                          {expandedCourseId === course._id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Course Details - Dropdown */}
                <CourseDetails 
                  course={course} 
                  onStartGame={handleStartGame}
                  isExpanded={expandedCourseId === course._id}
                />
              </div>
            ))
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-6 text-muted-foreground">
                  {searchQuery ? (
                    <>
                      <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No courses found matching "{searchQuery}"</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No courses available</p>
                      <p className="text-xs mt-1">Contact admin to add courses</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Start Round Modal */}
      {selectedCourseData && (
        <StartRoundModal
          course={selectedCourseData}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCourseId(null);
          }}
          onStartGame={handleStartFromModal}
        />
      )}
      </div>
  );
}